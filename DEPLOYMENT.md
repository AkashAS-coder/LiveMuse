# 🚀 LiveMuse Deployment Guide

## Overview
LiveMuse is a real-time collaborative AI-powered music platform with voice calls, chat, and AI assistance.

## Prerequisites
- Python 3.8+
- SSL certificate (for HTTPS)
- Google Gemini API key
- Domain name (optional but recommended)

## Environment Variables
Create a `.env` file in your project root:

```env
# Required
GEMINI_API_KEY=your_google_gemini_api_key_here
SECRET_KEY=your_secure_secret_key_here

# Optional
FLASK_ENV=production
PORT=5000
```

## Deployment Options

### 1. Heroku Deployment
```bash
# Install Heroku CLI
# Create Procfile
echo "web: gunicorn --worker-class eventlet -w 1 app:app" > Procfile

# Deploy
heroku create your-app-name
heroku config:set GEMINI_API_KEY=your_api_key
heroku config:set SECRET_KEY=your_secret_key
git push heroku main
```

### 2. DigitalOcean App Platform
1. Connect your GitHub repository
2. Set environment variables in the dashboard
3. Deploy with the following settings:
   - Build Command: `pip install -r requirements.txt`
   - Run Command: `gunicorn --worker-class eventlet -w 1 app:app`

### 3. VPS Deployment (Ubuntu/Debian)
```bash
# Install dependencies
sudo apt update
sudo apt install python3 python3-pip nginx

# Clone repository
git clone your-repo-url
cd your-repo

# Install Python dependencies
pip3 install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Set up systemd service
sudo nano /etc/systemd/system/livemuse.service
```

Systemd service file:
```ini
[Unit]
Description=LiveMuse Music App
After=network.target

[Service]
User=www-data
WorkingDirectory=/path/to/your/app
Environment=PATH=/path/to/your/app/venv/bin
ExecStart=/path/to/your/app/venv/bin/gunicorn --worker-class eventlet -w 1 app:app
Restart=always

[Install]
WantedBy=multi-user.target
```

### 4. Docker Deployment
Create `Dockerfile`:
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 5000

CMD ["gunicorn", "--worker-class", "eventlet", "-w", "1", "app:app"]
```

## Production Configuration

### 1. Update app.py for Production
```python
if __name__ == '__main__':
    # Development
    if os.getenv('FLASK_ENV') == 'development':
        socketio.run(app, debug=True, host='0.0.0.0', port=5000)
    else:
        # Production
        socketio.run(app, host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
```

### 2. Nginx Configuration (for VPS)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 3. SSL Certificate (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Security Considerations

### 1. Environment Variables
- ✅ Never commit API keys to version control
- ✅ Use strong SECRET_KEY
- ✅ Rotate keys regularly

### 2. HTTPS Requirements
- ✅ Voice calls require HTTPS
- ✅ WebRTC needs secure context
- ✅ SSL certificates are mandatory

### 3. Rate Limiting
Consider adding rate limiting for API endpoints:
```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)
```

## Monitoring & Maintenance

### 1. Logs
```bash
# View application logs
sudo journalctl -u livemuse -f

# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 2. Performance
- Monitor WebSocket connections
- Track voice call quality
- Monitor AI API usage

### 3. Updates
```bash
# Update application
git pull origin main
pip install -r requirements.txt
sudo systemctl restart livemuse
```

## Troubleshooting

### Common Issues:
1. **Voice calls not working**: Check HTTPS setup
2. **WebSocket errors**: Verify nginx proxy configuration
3. **AI not responding**: Check GEMINI_API_KEY
4. **Memory issues**: Monitor WebSocket connections

### Debug Mode:
```python
# Enable debug logging
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Scaling Considerations

### For High Traffic:
1. **Database**: Add Redis for session storage
2. **Load Balancing**: Use multiple app instances
3. **CDN**: Serve static files via CDN
4. **Monitoring**: Add application monitoring

### Example with Redis:
```python
import redis
from flask_session import Session

app.config['SESSION_TYPE'] = 'redis'
app.config['SESSION_REDIS'] = redis.from_url('redis://localhost:6379')
Session(app)
```

## Support
For deployment issues, check:
- Flask-SocketIO documentation
- WebRTC browser compatibility
- Google Gemini API quotas
- SSL certificate validity 