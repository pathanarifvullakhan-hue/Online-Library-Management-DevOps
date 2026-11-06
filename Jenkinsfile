
pipeline {
    agent any

    tools {
        nodejs 'Node20'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Run Unit Tests') {
            steps {
                sh 'npm test'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t online-library-management:${BUILD_NUMBER} .'
            }
        }

        stage('Compose Validation') {
            steps {
                sh 'docker compose config -q'
            }
        }

        stage('Start Selenium Browser') {
            steps {
                sh '''
                    docker rm -f library-selenium-${BUILD_NUMBER} || true

                    docker run -d \
                        --name library-selenium-${BUILD_NUMBER} \
                        -p 4444:4444 \
                        --shm-size=2g \
                        selenium/standalone-chrome:latest

                    for i in $(seq 1 30); do
                        if curl -fsS http://host.docker.internal:4444/status; then
                            echo "Selenium browser is ready"
                            exit 0
                        fi
                        sleep 2
                    done

                    echo "Selenium browser failed to start"
                    docker logs library-selenium-${BUILD_NUMBER}
                    exit 1
                '''
            }
        }

        stage('Selenium Browser Testing') {
            steps {
                withEnv([
                    'SELENIUM_REMOTE_URL=http://host.docker.internal:4444',
                    'APP_URL=http://host.docker.internal:3001'
                ]) {
                    sh 'npm run test:selenium'
                }
            }
        }
    }

    post {
        always {
            sh 'docker rm -f library-selenium-${BUILD_NUMBER} || true'
        }

        success {
            echo 'Library project and Selenium tests completed successfully!'
        }

        failure {
            echo 'Pipeline failed. Check the stage logs.'
        }
    }
}
