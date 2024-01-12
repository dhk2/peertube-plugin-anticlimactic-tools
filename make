cd peertube-plugin-lightning
npm run build
date
cd ..
peertube-cli plugins install --path /var/www/peertube/peertube-plugin-lightning
date
