pipeline {
    agent any

    stages {

        stage('Install Backend') {
            steps {
                dir('server') {
                    bat 'npm install'
                }
            }
        }

        stage('Test Backend') {
            steps {
                dir('server') {
                    bat 'npm test'
                }
            }
        }

        stage('Install Frontend') {
            steps {
                dir('client') {
                    bat 'npm install'
                }
            }
        }

        stage('Test Frontend') {
            steps {
                dir('client') {
                    bat 'npm test'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('client') {
                    bat 'npm run build'
                }
            }
        }
    }
}
