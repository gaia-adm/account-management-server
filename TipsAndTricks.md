####There are some tips, tricks and details to make understanding, debugging and troubleshooting easier 

##### What happens in passport (invitation flow) 
There are 2 files to debug or print details:
 - /node_modules/passport-google-oauth20/lib/strategy.js (Google specific settings and preparations)
 - /node_modules/oauth/lib/oauth.js (generic communication with IDP)
##### What happens in passport (login flow)
/node_modules/passport-google-id-token/lib/passport-google-id-token/strategy.js


##### Authorized origins:
 - https://${DOMAIN}
 - https://acmc.${DOMAIN}
 
#### Authorized redirect URIs:
 - https://acmc.${DOMAIN}/acmc/api/invitations/return.google
 - https://localhost/acmc/api/invitations/return.google - **_for Vagrant only_**
 
#### Re-seed the database
 - predefined users will be re-created when executing seed:run --production. During this process their assignment to any account will be removed. So do not assign them to any account, if needed create a additional (temporary or not) user and assign it to the account. 