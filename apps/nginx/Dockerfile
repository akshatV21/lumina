FROM nginx:alpine

COPY /apps/nginx/nginx.conf.template /etc/nginx/nginx.conf.template

CMD envsubst '\$PORT \$AUTH_URL \$MEDIA_URL \$POSTS_URL \$GATEWAY_URL \$NOTIFICATIONS_URL' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && nginx -g 'daemon off;'