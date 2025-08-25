#!/bin/bash

# Sandbox Security Check Script
# This script performs comprehensive security checks on the code execution sandbox

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
LOG_FILE="sandbox-security-check.log"

echo -e "${BLUE}=== Sandbox Security Check Started ===${NC}" | tee -a $LOG_FILE
echo "Timestamp: $(date)" | tee -a $LOG_FILE
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
        
        log_message "${BLUE}📁 $name permissions: $perms, owner: $owner${NC}"
        
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
        log_message "${BLUE}📊 $name contains $count files and $dir_count directories${NC}"
        
        if [ $count -gt 0 ]; then
            log_message "${YELLOW}⚠ $name contains files - checking for orphaned sandboxes${NC}"
            find "$dir" -type d -maxdepth 1 2>/dev/null | while read subdir; do
                if [ "$subdir" != "$dir" ]; then
                    local subdir_name=$(basename "$subdir")
                    local subdir_files=$(find "$subdir" -type f 2>/dev/null | wc -l)
                    log_message "${YELLOW}  - Subdirectory $subdir_name contains $subdir_files files${NC}"
                fi
            done
        fi
    fi
}

# Function to check for running processes
check_running_processes() {
    log_message "${BLUE}🔍 Checking for running sandbox processes...${NC}"
    
    # Check for Java processes
    local java_procs=$(pgrep -f "java.*sandbox" 2>/dev/null | wc -l)
    if [ $java_procs -gt 0 ]; then
        log_message "${YELLOW}⚠ Found $java_procs Java sandbox processes running${NC}"
        pgrep -f "java.*sandbox" | while read pid; do
            log_message "${YELLOW}  - Process $pid: $(ps -p $pid -o cmd=)${NC}"
        done
    else
        log_message "${GREEN}✓ No Java sandbox processes running${NC}"
    fi
    
    # Check for Python processes
    local python_procs=$(pgrep -f "python.*sandbox" 2>/dev/null | wc -l)
    if [ $python_procs -gt 0 ]; then
        log_message "${YELLOW}⚠ Found $python_procs Python sandbox processes running${NC}"
        pgrep -f "python.*sandbox" | while read pid; do
            log_message "${YELLOW}  - Process $pid: $(ps -p $pid -o cmd=)${NC}"
        done
    else
        log_message "${GREEN}✓ No Python sandbox processes running${NC}"
    fi
    
    # Check for Node.js processes
    local node_procs=$(pgrep -f "node.*sandbox" 2>/dev/null | wc -l)
    if [ $node_procs -gt 0 ]; then
        log_message "${YELLOW}⚠ Found $node_procs Node.js sandbox processes running${NC}"
        pgrep -f "node.*sandbox" | while read pid; do
            log_message "${YELLOW}  - Process $pid: $(ps -p $pid -o cmd=)${NC}"
        done
    else
        log_message "${GREEN}✓ No Node.js sandbox processes running${NC}"
    fi
}

# Function to check system resources
check_system_resources() {
    log_message "${BLUE}💻 Checking system resources...${NC}"
    
    # Check disk usage
    local disk_usage=$(df /tmp | tail -1 | awk '{print $5}' | sed 's/%//')
    log_message "${BLUE}📊 Disk usage in /tmp: ${disk_usage}%${NC}"
    
    if [ $disk_usage -gt 80 ]; then
        log_message "${RED}✗ High disk usage detected: ${disk_usage}%${NC}"
    elif [ $disk_usage -gt 60 ]; then
        log_message "${YELLOW}⚠ Moderate disk usage: ${disk_usage}%${NC}"
    else
        log_message "${GREEN}✓ Disk usage is acceptable: ${disk_usage}%${NC}"
    fi
    
    # Check memory usage
    local mem_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    log_message "${BLUE}📊 Memory usage: ${mem_usage}%${NC}"
    
    if (( $(echo "$mem_usage > 80" | bc -l) )); then
        log_message "${RED}✗ High memory usage detected: ${mem_usage}%${NC}"
    elif (( $(echo "$mem_usage > 60" | bc -l) )); then
        log_message "${YELLOW}⚠ Moderate memory usage: ${mem_usage}%${NC}"
    else
        log_message "${GREEN}✓ Memory usage is acceptable: ${mem_usage}%${NC}"
    fi
}

# Function to check for suspicious files
check_suspicious_files() {
    log_message "${BLUE}🔍 Checking for suspicious files...${NC}"
    
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
    log_message "${BLUE}🔍 Checking file permissions...${NC}"
    
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
    log_message "${BLUE}🔍 Checking for symbolic links...${NC}"
    
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

# Function to check for network connections
check_network_connections() {
    log_message "${BLUE}🌐 Checking for network connections...${NC}"
    
    local connections=$(netstat -tuln 2>/dev/null | grep -E ":(80|443|22|21|23|25|53|110|143|993|995)" | wc -l)
    if [ $connections -gt 0 ]; then
        log_message "${YELLOW}⚠ Found $connections network connections${NC}"
        netstat -tuln 2>/dev/null | grep -E ":(80|443|22|21|23|25|53|110|143|993|995)" | while read conn; do
            log_message "${YELLOW}  - $conn${NC}"
        done
    else
        log_message "${GREEN}✓ No suspicious network connections found${NC}"
    fi
}

# Main execution
main() {
    log_message "${BLUE}🔍 Starting comprehensive sandbox security check...${NC}"
    
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
    
    # Check network connections
    check_network_connections
    
    echo "" | tee -a $LOG_FILE
    log_message "${BLUE}=== Sandbox Security Check Completed ===${NC}"
    log_message "Check the log file: $LOG_FILE for detailed results"
}

# Run main function
main "$@"
