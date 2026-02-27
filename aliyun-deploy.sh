# 阿里云函数计算部署配置
# 部署 TWICE 小卡识别应用

## 1. 安装 Serverless Devs 工具
npm install @serverless-devs/s -g

## 2. 初始化项目
s init start-fc3-nodejs

## 3. 配置 s.yaml
cat > s.yaml << 'EOF'
edition: 3.0.0
name: twice-card-app
access: default

vars:
  region: cn-hangzhou
  functionName: twice-card-app
  serviceName: twice-card-service

resources:
  twice_card_app:
    component: fc3
    props:
      region: ${vars.region}
      serviceName: ${vars.serviceName}
      functionName: ${vars.functionName}
      runtime: custom.debian10
      cpu: 0.5
      memorySize: 512
      diskSize: 512
      timeout: 60
      instanceConcurrency: 10
      environmentVariables:
        KIMI_API_KEY: ${env.KIMI_API_KEY}
      customRuntimeConfig:
        command:
          - node
          - server.cjs
        port: 3000
      code: ./
      triggers:
        - triggerName: httpTrigger
          triggerType: http
          triggerConfig:
            authType: anonymous
            methods:
              - GET
              - POST
              - PUT
              - DELETE
EOF

## 4. 部署命令
s deploy

## 价格说明：
# - 免费额度：100万次调用/月，40万GB秒/月
# - 超出后：调用 0.013元/万次，执行时间 0.007元/GB秒
# - 本应用预计每月费用：0-10元（视使用量）