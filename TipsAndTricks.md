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
 
#### LIMITATIONS:
- **Vagrant only**: since our vagrant (.local) domain is not publicly accessible as Google Oauth2 requires and we don't use "localhost" as a hostname in order to handle cookies properly, invitation process is broken on vagrant. Once you receive "The site cannot be reached" error for the URL ending with /return.google, you need to replace localhost with acmc.gaia-local.skydns.local manually in the browser and refresh the page