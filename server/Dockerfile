# Node.js resmi imajını kullan (Versiyon 24)
FROM node:24-alpine

WORKDIR /app

# Paketleri yükle
COPY package*.json ./
# Sadece production paketlerini yükle (daha hafif olur)
RUN npm install --only=production

# Kaynak kodları kopyala
COPY . .

# SQLite veritabanı dosyasının oluşacağı/duracağı yer
# Docker container kapansa bile verinin kaybolmaması için burayı volume yapacağız.
# Uygulaman muhtemelen './database.sqlite' olarak arıyor.

EXPOSE 3000

# Uygulamayı başlat
CMD ["node", "index.js"] 