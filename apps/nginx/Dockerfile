FROM nginx:alpine

# Copy your template file into the container
COPY nginx.conf.template /etc/nginx/nginx.conf.template

# Use envsubst to replace variables, then start nginx
# We explicitly list the variables to prevent envsubst from clearing out Nginx's own variables like $host or $request_method
CMD envsubst '\$PORT \$AUTH_URL \$MEDIA_URL \$POSTS_URL \$GATEWAY_URL \$NOTIFICATIONS_URL' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && nginx -g 'daemon off;'