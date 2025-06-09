# [Meetgather](https://meetgather.site/)

A platform you’re able to form any kind of activities to invite netizens to participate your events. Also, it’s a website that makes you meet new friends who share the same hobbies with you.

## Motivation

I’m an adventurous person who would like to break my comfort zone to experience the world. People who want to experience new things or make new friends can utilize the web to make their lives splendid.
Most importantly, I’d like to showcase my full-stack developing skills and proficiency in AWS.

## Technologies

### Front ends

- ###### HTML, CSS, JavaScript
  I developed the web without using any templates on the internet. I did it from the scratch on my own.
- ###### Ajax
  Use async, await to fetch api and get data from server
- ###### Jinja
  Simplify HTML templates with Jinja
- ###### i18n
  The web can be adapted to English and Chinese
- ###### RWD
  Adapt web to any size of screen
- ###### Open Graph Protocol
  Add OG properties to have distinctive graphics and descriptions when sharing on social media
- ###### Google Maps API
  Apply Google map to show the accurate position of events

### Back ends

- ###### Python Flask
  Establish server with Flask
- ###### RESTful API
  Make use of RESTful API to let front-ends read, create, patch or delete data. All APIs URLs are displayed on second.py.
- ###### MVC
  Separate different functions in each part. Models are wrapped in models.db.py, views are in static and templates folders, controllers are in app.py
- ###### Smtplib
  Send emails with Python via Zoho Mail when hosts deliver messages to attendees
- ###### JWT
  Produce a limited token when an user login, which is a credential for server to identify the user
- ###### Nginx
  Utilize a reverse proxy to conceal IP address of the web with a domain name
- ###### Domain Name
  Create a domain name, meetgather.site, on GoDaddy and connecting it with IP address of _Meetgather_
- ###### SSL certificate
  Secure URL with https by Certbot
- ###### Docker
  Write Dockerfile, make an image and run the image on EC2 without setting up environment.
- ###### Third-party sign-in
  Use Google OAuth 2.0 to allow users to login without inventing an unique password

### AWS

- ###### EC2
  Run the application on EC2, using Ubuntu 22.04.4 LTS system.
- ###### RDS
  Deploy MySQL to store and preserve data.
- ###### lastiCache
  Run Redis to cache data with faster speed instead of requeasting data to RDS everytime.
- ###### S3
  Store photos of activities and personal profiles that users upload
- ###### CloudFront
  Display photos faster with CDN in AWS

## How to run the project?

### EC2

- Create AWS account and launch EC2 instance of Ubuntu 22.04.4
- Allocate and associate elastic IP address
- Go to Security Groups in EC2 and set up inbound rules, which is opening the port 2000, 80, 443, 3306, 6379.  
  2000 is port of the web, 80 is port of HTTP, 443 is port of HTTPS, 3306 is port of RDS and 6379 is port of Redis.
- Login EC2 and operate with Linux command line.
- The project needs to be run with .env file, so operator should ask authour for .env and put .env in a folder

### Docker

- Install docker on EC2

```basha
sudo apt-get update
```

```bash
sudo apt install docker.io
```

```bash
sudo systemctl enable docker
```

```bash
sudo systemctl start docker
```

- Check whether docker could run successfully

```bash
sudo docker run hello-world
```

- Pull the docker image

```bash
sudo pull alemapnil/meetgather_f
```

- Go to the folder containing .env, run the project with docker image and open port 2000. Later you can see the web through URL, which is "elastic IP:2000"

```bash
sudo docker run -d -p2000:2000 --env-file .env alemapnil/meetgather_f
```

### Domain name registrar

- Set up a domain name with elastic IP in A record
- Set up MX record and TXT record regarding email server, which is zoho.com. Ask authour about this

### Nginx

- Install nginx on EC2 and run

```bash
sudo apt update
```

```bash
sudo apt install nginx
```

```bash
sudo systemctl start nginx.service
```

- Check nginx status of operation

```bash
sudo systemctl status nginx
```

- Go to _nginx.conf_

```bash
sudo vim /etc/nginx/nginx.conf
```

- Amend _nginx.conf_ with commenting out two lines in _http{}_ and increasing _server{}_ in it.

```bash
http{
# include /etc/nginx/conf.d/*.conf;
# include /etc/nginx/sites-enabled/*;
server{}
}
```

- Set up elastic IP and port in _server{}_ well so that users could visit the web with domain name

```bash
server {
listen 80;
server_name meetgather.site;
client_max_body_size 4M;
location / {
	proxy_pass	http://elastic IP:2000/;
 	proxy_redirect	off;
  	proxy_set_header   Host			$host;
  	proxy_set_header   X-Real-IP		$remote_addr;
  	proxy_set_header   X-Forwarded-For	$proxy_add_x_forwarded_for;
  	proxy_set_header   X-Forwarded-Proto	$scheme;
  	add_header Content-Security-Policy upgrade-insecure-requests;}
}
```

- Confirm whether configuration of nginx is correct

```bash
sudo nginx -t
```

- Start nginx again and you can visit web through domain name

```bash
sudo systemctl restart nginx
```

### SSL

- Add SSL on domain name through Certbot

```bash
sudo snap install --classic certbot
```

```bash
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

```bash
sudo apt-get install python3-certbot-nginx
```

```bash
sudo certbot --nginx
```

## AWS Frame
![frame](https://github.com/user-attachments/assets/536960f5-b7d2-4c5e-99e8-c72bcead4630)
## How to Use the Web?

https://github.com/alemapnil/meetgather/assets/52197443/ef1e1834-aea8-4a5e-a7ca-1b3f89d04c64
