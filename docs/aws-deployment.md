# AWS Deployment Notes (Ready-to-Implement)

Recommended AWS mapping:

- `backend/` -> ECS Fargate service behind an ALB
- `ai-engine/` -> ECS Fargate service behind an internal ALB or service discovery
- `database/` -> Amazon RDS for PostgreSQL (Multi-AZ)
- `frontend/` -> S3 + CloudFront (static) or containerized behind ALB

Operational pieces:

- **Config/secrets**: AWS Secrets Manager / SSM Parameter Store (inject as env vars)
- **Logging**: CloudWatch Logs (structured JSON recommended in production)
- **Networking**: VPC private subnets for services + RDS; public for ALB/CloudFront only
- **CI/CD**: build Docker images, push to ECR, deploy ECS task definitions

This repo already includes Dockerfiles for `backend/`, `ai-engine/`, and `frontend/` plus a local `docker-compose.yml`.

