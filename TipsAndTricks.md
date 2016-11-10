####There are some tips, tricks and details to make understanding, debugging and troubleshooting easier 

##### What happens in passport (invitation flow) 
There are 2 files to debug or print details:
 - /node_modules/passport-google-oauth20/lib/strategy.js (Google specific settings and preparations)
 - /node_modules/oauth/lib/oauth.js (generic communication with IDP)

##### Authorized origins:
 - https://${DOMAIN}
 - https://acmc.${DOMAIN}
 

 