provider "aws" {
  region = "eu-central-1"
}

resource "aws_ecs_cluster" "my_cluster" {
  name = "node-cluster"
}

resource "aws_ecs_task_definition" "app" {
  family                   = "node-app"
  network_mode             = "awsvpc"
  execution_role_arn       = "arn:aws:iam::992382627256:role/ecsTaskExecutionRole" #EDIT IDs
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"

  container_definitions = jsonencode([
    {
      name      = "node-test"
      image     = "992382627256.dkr.ecr.eu-central-1.amazonaws.com/node-test"  # SET IMAGE
      cpu       = 256
      memory    = 512
      essential = true
      portMappings = [
        {
          containerPort = 80
          hostPort      = 80
          protocol      = "tcp"
        }
      ]
    }
  ])
}

resource "aws_security_group" "app_sg" {
  name        = "app-sg"
  description = "Allow HTTP traffic"
  vpc_id      = "vpc-0e0ca98df725e313c"  # Replace with your VPC ID

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_lb" "app_lb" {
  name               = "app-lb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.app_sg.id]
  subnets            = ["subnet-0a72b50aa3d0128f2", "subnet-02011297bd7572c96","subnet-0d9e43161039d1a1f" ]  # Replace with your subnet IDs
}

resource "aws_lb_listener" "front_end" {
  load_balancer_arn = aws_lb.app_lb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_tg.arn
  }
}

resource "aws_lb_target_group" "app_tg" {
  name     = "app-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = "vpc-0e0ca98df725e313c"  # Replace with your VPC ID
  target_type = "ip"  # This line specifies the target type required for Fargate tasks
}

resource "aws_ecs_service" "app_service" {
  name            = "node-service"
  cluster         = aws_ecs_cluster.my_cluster.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets = ["subnet-0a72b50aa3d0128f2", "subnet-02011297bd7572c96","subnet-0d9e43161039d1a1f" ]  # Replace with your subnet IDs
    security_groups = [aws_security_group.app_sg.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app_tg.arn
    container_name   = "node-test"
    container_port   = 80
  }

  depends_on = [
    aws_lb_listener.front_end,
    aws_lb_target_group.app_tg
  ]
}

output "load_balancer_dns" {
  value = aws_lb.app_lb.dns_name
  description = "The DNS name of the load balancer"
}
