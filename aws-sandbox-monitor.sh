#!/bin/bash

# AWS Sandbox Security Monitor Script
# This script performs comprehensive sandbox security checks on AWS EC2 deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SANDBOX_BASE_DIR="/tmp/snippethub_sandbox"
SECURE_TEMP_DIR="/tmp/snippethub_secure"
LOG_FILE="/var/log/sandbox-security-check.log"
API_BASE_URL="https://snippethub.co.kr"
ADMIN_TOKEN="${ADMIN_JWT_TOKEN}"  # 환경 변수에서 가져옴

echo -e "${BLUE}=== AWS Sandbox Security Check Started ===${NC}" | tee -a $LOG_FILE
echo "Timestamp: $(date)" | tee -a $LOG_FILE
echo "Instance: $(hostname)" | tee -a $LOG_FILE
echo "Region: $(curl -s http://169.254.169.254/latest/meta-data/placement/region 2>/dev/null || echo 'Unknown')" | tee -a $LOG_FILE
echo "" | tee -a $LOG_FILE

# Function to log messages
log_message() {
    echo -e "$1" | tee -a $LOG_FILE
}

# Function to check if directory exists and is accessible
check_directory() {
    local dir=$1
    local name=$2
    
    if [ -d "$dir" ]; then
        if [ -r "$dir" ] && [ -w "$dir" ]; then
            log_message "${GREEN}✓ $name directory exists and is accessible${NC}"
            return 0
        else
            log_message "${RED}✗ $name directory exists but is not accessible${NC}"
            return 1
        fi
    else
        log_message "${YELLOW}⚠ $name directory does not exist${NC}"
        return 1
    fi
}

# Function to check directory permissions
check_permissions() {
    local dir=$1
    local name=$2
    
    if [ -d "$dir" ]; then
        local perms=$(stat -c "%a" "$dir")
        local owner=$(stat -c "%U" "$dir")
        
        log_message "${BLUE}Directory $name permissions: $perms, owner: $owner${NC}"
        
        # Check if permissions are restrictive enough
        if [[ "$perms" == "700" || "$perms" == "750" ]]; then
            log_message "${GREEN}✓ $name has secure permissions${NC}"
        else
            log_message "${YELLOW}⚠ $name permissions might be too permissive: $perms${NC}"
        fi
    fi
}

# Function to count files in directory
count_files() {
    local dir=$1
    local name=$2
    
    if [ -d "$dir" ]; then
        local count=$(find "$dir" -type f 2>/dev/null | wc -l)
        local dir_count=$(find "$dir" -type d 2>/dev/null | wc -l)
        log_message "${BLUE}Stats $name contains $count files and $dir_count directories${NC}"
        
        if [ $count -gt 0 ]; then
            log_message "${YELLOW}⚠ $name contains files - checking for orphaned sandboxes${NC}"
            find "$dir" -type d -maxdepth 1 2>/dev/null | while read subdir; do
                if [ "$subdir" != "$dir" ]; then
                    local subdir_name=$(basename "$subdir")
                    local subdir_files=$(find "$subdir" -type f 2>/dev/null | wc -l)
                    local subdir_age=$(find "$subdir" -maxdepth 0 -printf '%T@\n' 2>/dev/null | cut -d. -f1)
                    local current_time=$(date +%s)
                    local age_minutes=$(( (current_time - subdir_age) / 60 ))
                    
                    log_message "${YELLOW}  - Subdirectory $subdir_name: $subdir_files files, age: ${age_minutes} minutes${NC}"
                    
                    # 경고: 1시간 이상 된 샌드박스
                    if [ $age_minutes -gt 60 ]; then
                        log_message "${RED}    WARNING: Sandbox $subdir_name is older than 1 hour!${NC}"
                    fi
                fi
            done
        fi
    fi
}

# Function to check for running processes
check_running_processes() {
    log_message "${BLUE}Checking for running sandbox processes...${NC}"
    
    # Check for Java processes
    local java_procs=$(pgrep -f "java.*sandbox" 2>/dev/null | wc -l)
    if [ $java_procs -gt 0 ]; then
        log_message "${YELLOW}⚠ Found $java_procs Java sandbox processes running${NC}"
        pgrep -f "java.*sandbox" | while read pid; do
            local cmd=$(ps -p $pid -o cmd= 2>/dev/null || echo "Unknown")
            local mem=$(ps -p $pid -o %mem= 2>/dev/null || echo "Unknown")
            log_message "${YELLOW}  - Process $pid: $cmd (Memory: ${mem}%)${NC}"
        done
    else
        log_message "${GREEN}✓ No Java sandbox processes running${NC}"
    fi
    
    # Check for Python processes
    local python_procs=$(pgrep -f "python.*sandbox" 2>/dev/null | wc -l)
    if [ $python_procs -gt 0 ]; then
        log_message "${YELLOW}⚠ Found $python_procs Python sandbox processes running${NC}"
        pgrep -f "python.*sandbox" | while read pid; do
            local cmd=$(ps -p $pid -o cmd= 2>/dev/null || echo "Unknown")
            local mem=$(ps -p $pid -o %mem= 2>/dev/null || echo "Unknown")
            log_message "${YELLOW}  - Process $pid: $cmd (Memory: ${mem}%)${NC}"
        done
    else
        log_message "${GREEN}✓ No Python sandbox processes running${NC}"
    fi
    
    # Check for Node.js processes
    local node_procs=$(pgrep -f "node.*sandbox" 2>/dev/null | wc -l)
    if [ $node_procs -gt 0 ]; then
        log_message "${YELLOW}⚠ Found $node_procs Node.js sandbox processes running${NC}"
        pgrep -f "node.*sandbox" | while read pid; do
            local cmd=$(ps -p $pid -o cmd= 2>/dev/null || echo "Unknown")
            local mem=$(ps -p $pid -o %mem= 2>/dev/null || echo "Unknown")
            log_message "${YELLOW}  - Process $pid: $cmd (Memory: ${mem}%)${NC}"
        done
    else
        log_message "${GREEN}✓ No Node.js sandbox processes running${NC}"
    fi
}

# Function to check system resources
check_system_resources() {
    log_message "${BLUE}Checking system resources...${NC}"
    
    # Check disk usage
    local disk_usage=$(df /tmp | tail -1 | awk '{print $5}' | sed 's/%//')
    log_message "${BLUE}Disk usage in /tmp: ${disk_usage}%${NC}"
    
    if [ $disk_usage -gt 80 ]; then
        log_message "${RED}✗ High disk usage detected: ${disk_usage}%${NC}"
    elif [ $disk_usage -gt 60 ]; then
        log_message "${YELLOW}⚠ Moderate disk usage: ${disk_usage}%${NC}"
    else
        log_message "${GREEN}✓ Disk usage is acceptable: ${disk_usage}%${NC}"
    fi
    
    # Check memory usage
    local mem_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    log_message "${BLUE}Memory usage: ${mem_usage}%${NC}"
    
    if (( $(echo "$mem_usage > 80" | bc -l) )); then
        log_message "${RED}✗ High memory usage detected: ${mem_usage}%${NC}"
    elif (( $(echo "$mem_usage > 60" | bc -l) )); then
        log_message "${YELLOW}⚠ Moderate memory usage: ${mem_usage}%${NC}"
    else
        log_message "${GREEN}✓ Memory usage is acceptable: ${mem_usage}%${NC}"
    fi
    
    # Check CPU usage
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    log_message "${BLUE}CPU usage: ${cpu_usage}%${NC}"
    
    if (( $(echo "$cpu_usage > 80" | bc -l) )); then
        log_message "${RED}✗ High CPU usage detected: ${cpu_usage}%${NC}"
    elif (( $(echo "$cpu_usage > 60" | bc -l) )); then
        log_message "${YELLOW}⚠ Moderate CPU usage: ${cpu_usage}%${NC}"
    else
        log_message "${GREEN}✓ CPU usage is acceptable: ${cpu_usage}%${NC}"
    fi
}

# Function to check for suspicious files
check_suspicious_files() {
    log_message "${BLUE}Checking for suspicious files...${NC}"
    
    local suspicious_patterns=(
        "*.sh"
        "*.exe"
        "*.bat"
        "*.cmd"
        "*.vbs"
        "*.js"
        "*.py"
        "*.jar"
        "*.war"
        "*.ear"
    )
    
    local found_suspicious=false
    
    for pattern in "${suspicious_patterns[@]}"; do
        local files=$(find "$SANDBOX_BASE_DIR" -name "$pattern" 2>/dev/null | wc -l)
        if [ $files -gt 0 ]; then
            log_message "${YELLOW}⚠ Found $files files matching pattern: $pattern${NC}"
            find "$SANDBOX_BASE_DIR" -name "$pattern" 2>/dev/null | while read file; do
                log_message "${YELLOW}  - $file${NC}"
            done
            found_suspicious=true
        fi
    done
    
    if [ "$found_suspicious" = false ]; then
        log_message "${GREEN}✓ No suspicious files found${NC}"
    fi
}

# Function to check file permissions
check_file_permissions() {
    log_message "${BLUE}Checking file permissions...${NC}"
    
    local executable_files=$(find "$SANDBOX_BASE_DIR" -type f -executable 2>/dev/null | wc -l)
    if [ $executable_files -gt 0 ]; then
        log_message "${YELLOW}⚠ Found $executable_files executable files in sandbox${NC}"
        find "$SANDBOX_BASE_DIR" -type f -executable 2>/dev/null | while read file; do
            local perms=$(stat -c "%a" "$file")
            log_message "${YELLOW}  - $file (permissions: $perms)${NC}"
        done
    else
        log_message "${GREEN}✓ No executable files found in sandbox${NC}"
    fi
}

# Function to check for symbolic links
check_symbolic_links() {
    log_message "${BLUE}Checking for symbolic links...${NC}"
    
    local symlinks=$(find "$SANDBOX_BASE_DIR" -type l 2>/dev/null | wc -l)
    if [ $symlinks -gt 0 ]; then
        log_message "${RED}✗ Found $symlinks symbolic links in sandbox${NC}"
        find "$SANDBOX_BASE_DIR" -type l 2>/dev/null | while read link; do
            local target=$(readlink "$link")
            log_message "${RED}  - $link -> $target${NC}"
        done
    else
        log_message "${GREEN}✓ No symbolic links found in sandbox${NC}"
    fi
}

# Function to check application logs
check_application_logs() {
    log_message "${BLUE}Checking application logs...${NC}"
    
    # Check systemd service logs
    local service_status=$(systemctl is-active snippethub-backend 2>/dev/null || echo "inactive")
    log_message "${BLUE}SnippetHub Backend Service Status: $service_status${NC}"
    
    if [ "$service_status" = "active" ]; then
        log_message "${GREEN}✓ Backend service is running${NC}"
        
        # Check recent sandbox-related logs
        local recent_sandbox_logs=$(journalctl -u snippethub-backend --since "1 hour ago" | grep -i sandbox | wc -l)
        log_message "${BLUE}Sandbox-related logs in last hour: $recent_sandbox_logs${NC}"
        
        # Check for errors
        local recent_errors=$(journalctl -u snippethub-backend --since "1 hour ago" | grep -i "error.*sandbox" | wc -l)
        if [ $recent_errors -gt 0 ]; then
            log_message "${YELLOW}⚠ Found $recent_errors sandbox-related errors in last hour${NC}"
            journalctl -u snippethub-backend --since "1 hour ago" | grep -i "error.*sandbox" | tail -5 | while read line; do
                log_message "${YELLOW}  - $line${NC}"
            done
        else
            log_message "${GREEN}✓ No sandbox-related errors in last hour${NC}"
        fi
    else
        log_message "${RED}✗ Backend service is not running${NC}"
    fi
}

# Function to check API endpoints
check_api_endpoints() {
    log_message "${BLUE}Checking API endpoints...${NC}"
    
    if [ -z "$ADMIN_TOKEN" ]; then
        log_message "${YELLOW}⚠ ADMIN_JWT_TOKEN not set, skipping API checks${NC}"
        return
    fi
    
    # Check sandbox health endpoint
    local health_response=$(curl -s -w "%{http_code}" -o /tmp/health_response.json \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        "$API_BASE_URL/api/v1/admin/sandbox/health" 2>/dev/null || echo "000")
    
    if [ "$health_response" = "200" ]; then
        log_message "${GREEN}✓ Sandbox health endpoint is accessible${NC}"
        local health_data=$(cat /tmp/health_response.json)
        log_message "${BLUE}Health data: $health_data${NC}"
    else
        log_message "${RED}✗ Sandbox health endpoint returned status: $health_response${NC}"
    fi
    
    # Check sandbox status endpoint
    local status_response=$(curl -s -w "%{http_code}" -o /tmp/status_response.json \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        "$API_BASE_URL/api/v1/admin/sandbox/status" 2>/dev/null || echo "000")
    
    if [ "$status_response" = "200" ]; then
        log_message "${GREEN}✓ Sandbox status endpoint is accessible${NC}"
        local status_data=$(cat /tmp/status_response.json)
        log_message "${BLUE}Status data: $status_data${NC}"
    else
        log_message "${RED}✗ Sandbox status endpoint returned status: $status_response${NC}"
    fi
    
    # Clean up temp files
    rm -f /tmp/health_response.json /tmp/status_response.json
}

# Function to check for orphaned sandboxes
check_orphaned_sandboxes() {
    log_message "${BLUE}Checking for orphaned sandboxes...${NC}"
    
    if [ -z "$ADMIN_TOKEN" ]; then
        log_message "${YELLOW}⚠ ADMIN_JWT_TOKEN not set, skipping orphan check${NC}"
        return
    fi
    
    local orphan_response=$(curl -s -w "%{http_code}" -o /tmp/orphan_response.json \
        -X POST \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        "$API_BASE_URL/api/v1/admin/sandbox/check-orphans" 2>/dev/null || echo "000")
    
    if [ "$orphan_response" = "200" ]; then
        log_message "${GREEN}✓ Orphan check completed successfully${NC}"
        local orphan_data=$(cat /tmp/orphan_response.json)
        log_message "${BLUE}Orphan check result: $orphan_data${NC}"
    else
        log_message "${RED}✗ Orphan check failed with status: $orphan_response${NC}"
    fi
    
    rm -f /tmp/orphan_response.json
}

# Main execution
main() {
    log_message "${BLUE}Starting comprehensive AWS sandbox security check...${NC}"
    
    # Check directories
    check_directory "$SANDBOX_BASE_DIR" "Sandbox base"
    check_directory "$SECURE_TEMP_DIR" "Secure temp"
    
    # Check permissions
    check_permissions "$SANDBOX_BASE_DIR" "Sandbox base"
    check_permissions "$SECURE_TEMP_DIR" "Secure temp"
    
    # Count files
    count_files "$SANDBOX_BASE_DIR" "Sandbox base"
    count_files "$SECURE_TEMP_DIR" "Secure temp"
    
    # Check running processes
    check_running_processes
    
    # Check system resources
    check_system_resources
    
    # Check for suspicious files
    check_suspicious_files
    
    # Check file permissions
    check_file_permissions
    
    # Check for symbolic links
    check_symbolic_links
    
    # Check application logs
    check_application_logs
    
    # Check API endpoints
    check_api_endpoints
    
    # Check for orphaned sandboxes
    check_orphaned_sandboxes
    
    echo "" | tee -a $LOG_FILE
    log_message "${BLUE}=== AWS Sandbox Security Check Completed ===${NC}"
    log_message "Check the log file: $LOG_FILE for detailed results"
    
    # Send summary to CloudWatch or other monitoring service
    local summary="Sandbox security check completed on $(hostname) at $(date)"
    echo "$summary" >> $LOG_FILE
}

# Run main function
main "$@"
