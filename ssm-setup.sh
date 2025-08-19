#!/bin/bash
# SSM Agent 설치 및 설정
yum install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

# 백엔드 애플리케이션 재시작
systemctl restart snippethub-backend
