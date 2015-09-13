
### Fake keys for local testing
cribbed from [grunt contrib docs](https://github.com/gruntjs/grunt-contrib-connect#advanced-https-config) 

### Create Fake ca.key, do not use a password
### When asked 'Common Name (e.g. server FQDN or YOUR name) []:' use your hostname, i.e 'mysite.dev'

        openssl genrsa -out ca.key 1024
        openssl req -new -key ca.key -out ca.csr
        openssl x509 -req -days 730 -in ca.csr -out ca.crt -signkey ca.key

### Create server certificate and signing request
 * do not use a password
 * domain as 'localhost'
 

    openssl genrsa -out server.key 1024
    openssl req -new -key server.key -out server.csr

### Generate self-siged certificate

    openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt
    
    
### After generating new keys

Every time you change the certs you need to email everyone and instruct them to do the following:

    You need to run grunt watch and navigate to both of these URLs:
    
    https://localhost:4321/#/login
    https://localhost:35729/livereload.js?snipver=1
    
    For each one, you will get a cert warning error.  Add an exception and mark it as permanent.