const express = require('express');
const mysql = require('mysql2/promise');
const AWS = require('aws-sdk');

const app = express();
const port = 3000;

// RDS接続設定
const dbConfig = {
  host: process.env.DB_HOST, // 環境変数から読み込む
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'appdb' // デフォルト値も設定可能
};

// S3設定
const s3 = new AWS.S3({ region: process.env.AWS_REGION || 'ap-northeast-1' });
const bucketName = process.env.S3_BUCKET_NAME; // 環境変数から読み込む
const imageKey = process.env.S3_IMAGE_KEY || 'test.jpg'; // デフォルト値も設定可能

app.use((req, res, next) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  next();
});

app.get('/api/data', async (req, res) => {
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute('SELECT id, name FROM users');

    const url = s3.getSignedUrl('getObject', {
      Bucket: bucketName,
      Key: imageKey,
      Expires: 60
    });

    res.json({ status: 'ok', users: rows, image: url }); //usersというデータベースを使用
  } catch (err) {
    console.error('Error in /api/data:', err);  // スタックトレース付きでエラー出力
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`App running at http://0.0.0.0:${port}`);
});