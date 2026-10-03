pipeline {
    agent any

    environment {
        PROJECT_NAME = 'dementia-screening'

        // Jenkins credential IDs
        DJANGO_SECRET = credentials('django-secret-key')
        MYSQL_PASSWORD = credentials('mysql-password')

        EMAIL_CREDENTIALS = credentials('email-password')
    }

    stages {

        stage('Checkout') {
            steps {
                echo '📥 Checking out source code...'

                checkout scm
            }
        }

        stage('Prepare Environment') {
            steps {
                echo '🔐 Creating runtime environment file...'

                sh '''
                    cat > backend/.env <<EOF
DEBUG=False
SECRET_KEY=${DJANGO_SECRET}

DB_ENGINE=django.db.backends.mysql
DB_NAME=dementia_db
DB_USER=root
DB_PASSWORD=${MYSQL_PASSWORD}
DB_HOST=mysql
DB_PORT=3306

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_TLS=True
EMAIL_HOST_USER=djangohosting999@gmail.com
EMAIL_HOST_PASSWORD=${EMAIL_CREDENTIALS_PSW}
EOF

                    chmod 600 backend/.env
                '''
            }
        }

        stage('Frontend Lint & Build') {
            steps {
                echo 'Use existing frontend Docker image to lint and build the frontend...'

                sh '''
                   test -d frontend/dist
                   test -f frontend/dist/index.html
                   echo "Exsiting frontend/dist directory and index.html file. Skipping frontend build."
                   ls -lah frontend/dist
                '''
            }
        }

        stage('Backend Docker Build') {
            steps {
                echo '🐳 Building backend Docker image...'

                sh '''
                    docker compose build backend
                '''
            }
        }

        stage('Nginx Docker Build') {
            steps {
                echo '🌐 Building nginx image with frontend/dist...'

                sh '''
                    docker compose build nginx
                '''
            }
        }

        stage('Validate Compose') {
            steps {
                echo '🔎 Validating Docker Compose configuration...'

                sh '''
                    docker compose config --quiet
                '''
            }
        }

        stage('Start Application') {
            steps {
                echo '🚀 Starting MySQL, backend and nginx...'

                sh '''
                    docker compose up -d
                '''
            }
        }

        stage('Django System Check') {
            steps {
                echo '🧪 Running Django system checks...'

                sh '''
                    docker compose exec -T backend python manage.py check
                '''
            }
        }

        stage('Database Migration') {
            steps {
                echo '🗄️ Applying Django database migrations...'

                sh '''
                    docker compose exec -T backend python manage.py migrate --noinput
                '''
            }
        }

        stage('Application Health Check') {
            steps {
                echo '❤️ Checking application health...'

                sh '''
                    sleep 5

                    echo "Checking Django backend..."
                    docker compose exec -T backend \
                        curl -fsS http://localhost:8000/api/health/

                    echo "Checking Nginx..."

                    NETWORK=$(docker inspect dementia-nginx \
                        --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}')

                    docker run --rm \
                        --network "$NETWORK" \
                        curlimages/curl:latest \
                        curl -fsS http://nginx/
                '''
            }
}
    }

    post {

        always {
            echo '📋 Showing running containers...'

            sh '''
                docker compose ps || true
            '''

            echo '🧹 Cleaning generated secrets...'

            sh '''
                rm -f backend/.env
            '''
        }

        success {
            echo '✅ CI/CD pipeline completed successfully!'
        }

        failure {
            echo '❌ Pipeline failed. Check the Jenkins console output.'
        }
    }
}