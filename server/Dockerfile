# Node.js resmi imajını kullan (Versiyon 24)
FROM node:24-alpine

WORKDIR /app

# Paketleri yükle
COPY package*.json ./
# Sadece production paketlerini yükle (daha hafif olur)
RUN npm install --only=production

# Kaynak kodları kopyala
COPY . .

EXPOSE 3000

# Uygulamayı başlat
CMD ["node", "index.js"] 