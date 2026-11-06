pipeline {
  agent any
  tools { nodejs 'Node20' }
  environment {
    IMAGE_NAME = 'online-library-management'
  }
  stages {
    stage('Checkout') {
      steps { checkout scm }
    }
    stage('Install dependencies') {
      steps { sh 'npm install' }
    }
    stage('Run tests') {
      steps { sh 'npm test' }
    }
    stage('Build Docker image') {
      steps { sh 'docker build -t online-library-management:${BUILD_NUMBER} .' }
    }
    stage('Compose validation') {
      steps { sh 'docker compose config -q' }
    }
  }
  post {
    success { echo 'Library project pipeline completed successfully.' }
    failure { echo 'Pipeline failed. Check the stage logs above.' }
  }
}