# Variáveis de Ambiente para Vercel

## 📋 Valores extraídos do serviceAccountKey.json

Use estes valores exatos no painel do Vercel:

### 1. FIREBASE_ADMIN_PROJECT_ID
```
la-vie---coiffeur
```

### 2. FIREBASE_ADMIN_CLIENT_EMAIL
```
firebase-adminsdk-fbsvc@la-vie---coiffeur.iam.gserviceaccount.com
```

### 3. FIREBASE_ADMIN_PRIVATE_KEY
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCbo/Wi6ug97kEJ
L60v7RZiwPhAmomK+zCjyDdCbnlbPVq9O3SZZfYAuV9U8AAdT1TnQaKsgQI5RQOL
Jh6ytIZSU1OjcFFlA2XPETcbOvDlI7RufQbs2lJeA+Y7A3Vp/cfq3u74Etv6CfnC
fZ95tz/soVQ5KZwN63ruMrZ58pkNLQfy0TGA5TMujszYRlvbPVoB1iAM2MMl8fsw
EgCRNNdZ2Y/c52ab1sVwyvFx/wXK+7w5KBYJ7sge/pemRhqcq291d6phIbjncR/P
f/GdTJzKwfE+wHupettzMADQykYA3G2CwADS8Gb6I6F4NRPKd+ONOa7Y+jUPczRa
CkaYbLLNAgMBAAECggEAJ9Y/LKyQti1SAy5rVz2JgcxfnnWPp/2kVP+NuVi6gjKB
k7bwoMTawxOvhXeKp/XixvBjWWEJ9yulfQvMRrRzPwYp/cblZoQInogLAVLETvol
GDSzPZOiCoNX/hnkBzWYYpMeOmvlVyoPfgsWcxqG56PhgWIXme6AgBCF6U/Bgf/y
jVvX360jqy5qdZNRlF9Ho6oa1hpjBBfNegl8pPtHLCsjnVpt6KLWVdBfPKaA3vvZ
Dqkikdzj8gPzptFVKXmcRRdbU34jAbb55T6gja6LjNWSnc4bYjheu7gllI4b/c8/
I/X9wCJWi8ZZXZVu7GvXWGguT0IQDrYS32Ylh/eApwKBgQDbDH8usBtnk+7hzqbU
aZ/hvqXk5H9fnIWGd6n2+3gbtMsH/BRXKzAMSlekvncczQj4I8BKxhikrKupLUCe
m2C2MV7J8+tFqrJ6EKC7HjmFvwJjNH1GptkF0mhW7fH7whqY1tPJ2CV4Cs1wt0Zb
kmdN+Qecy/ylt41LbmG+ITYaGwKBgQC15TU3ks3w7ZtC46BCXlHEIITLMLGU8gjj
8mRhLWmWWNhLqj/gcSaweMwHHgM+YQF8HIOmYOjntTNK2kgblGgBndbN5thyzAZ7
Ar0H3ldrNLkN5pnnRaXq5p/60jUMGEuOhxR8ap5EvVenRBdA3tvScdOrLuM+pS/N
t78ydYi1NwKBgQDRyYAtCMDWTFnmrXId0SMsothjBWvv+AnxpL2FK4X2kwo4FXat
nVEhFDooL7oIPV4vuJ27f0muvSiSmCJhRNI068eqhw9242qXeUFWtDXHIA57UJQC
jF0hNEh1qOGuilHKu0SO9ZG9DCuBniWmIesKREzEIKFRXR/XdFnsLAaSrQKBgBSH
s1L7cd0gpGaPVJZJGQd++B4K9/AsxU4dHLFPM9yxWHBp3d3SR6Chcb3X6FvRDR7a
BQ3xYDhO3mQzcPIT9Q1BqG4DASkr2AtoSrepo8pI4B4uie5tkQWLVEE2GqCr2VNT
8b79NbHigRMy/0DmJn+BM3fdye5XLKcWdzEVzQFPAoGABF4iS6rRLqRW5IQqB7q1
sqdbWJb7k7DhpjCuJL+zNKs9zvJPjMJse8vd4VyoKxP9fHR44ol0YiBPgP3OYGwG
j3OLvrFV39d3yRzyad77LHjFT29TR43LATBpp9S3YQLFpREvl9wtuD9GavHFZGpv
PucTJX24XHtd1P2BcZmQHiw=
-----END PRIVATE KEY-----
```

**⚠️ IMPORTANTE:** Ao colar no Vercel, mantenha as quebras de linha `\n` ou coloque entre aspas duplas.

### 4. GEMINI_API_KEY
```
(sua-chave-do-gemini-aqui)
```
Obtenha em: https://makersuite.google.com/app/apikey

---

## 📝 Passo a passo no Vercel:

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em: **Settings → Environment Variables**
4. Clique em **"Add New"** e adicione cada variável acima
5. Para `FIREBASE_ADMIN_PRIVATE_KEY`, cole o valor completo (com todas as linhas)
6. Faça um novo deploy para aplicar as mudanças

