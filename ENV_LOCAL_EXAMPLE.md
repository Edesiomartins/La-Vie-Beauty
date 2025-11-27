# Exemplo de .env.local

## 📋 Formato do arquivo `.env.local`

Crie um arquivo `.env.local` na **raiz do projeto** (mesmo nível do `package.json`) com o seguinte formato:

```env
# Firebase Admin SDK
FIREBASE_ADMIN_PROJECT_ID=la-vie---coiffeur
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-fbsvc@la-vie---coiffeur.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCbo/Wi6ug97kEJ\nL60v7RZiwPhAmomK+zCjyDdCbnlbPVq9O3SZZfYAuV9U8AAdT1TnQaKsgQI5RQOL\nJh6ytIZSU1OjcFFlA2XPETcbOvDlI7RufQbs2lJeA+Y7A3Vp/cfq3u74Etv6CfnC\nfZ95tz/soVQ5KZwN63ruMrZ58pkNLQfy0TGA5TMujszYRlvbPVoB1iAM2MMl8fsw\nEgCRNNdZ2Y/c52ab1sVwyvFx/wXK+7w5KBYJ7sge/pemRhqcq291d6phIbjncR/P\nf/GdTJzKwfE+wHupettzMADQykYA3G2CwADS8Gb6I6F4NRPKd+ONOa7Y+jUPczRa\nCkaYbLLNAgMBAAECggEAJ9Y/LKyQti1SAy5rVz2JgcxfnnWPp/2kVP+NuVi6gjKB\nk7bwoMTawxOvhXeKp/XixvBjWWEJ9yulfQvMRrRzPwYp/cblZoQInogLAVLETvol\nGDSzPZOiCoNX/hnkBzWYYpMeOmvlVyoPfgsWcxqG56PhgWIXme6AgBCF6U/Bgf/y\njVvX360jqy5qdZNRlF9Ho6oa1hpjBBfNegl8pPtHLCsjnVpt6KLWVdBfPKaA3vvZ\nDqkikdzj8gPzptFVKXmcRRdbU34jAbb55T6gja6LjNWSnc4bYjheu7gllI4b/c8/\nI/X9wCJWi8ZZXZVu7GvXWGguT0IQDrYS32Ylh/eApwKBgQDbDH8usBtnk+7hzqbU\naZ/hvqXk5H9fnIWGd6n2+3gbtMsH/BRXKzAMSlekvncczQj4I8BKxhikrKupLUCe\nm2C2MV7J8+tFqrJ6EKC7HjmFvwJjNH1GptkF0mhW7fH7whqY1tPJ2CV4Cs1wt0Zb\nkmdN+Qecy/ylt41LbmG+ITYaGwKBgQC15TU3ks3w7ZtC46BCXlHEIITLMLGU8gjj\n8mRhLWmWWNhLqj/gcSaweMwHHgM+YQF8HIOmYOjntTNK2kgblGgBndbN5thyzAZ7\nAr0H3ldrNLkN5pnnRaXq5p/60jUMGEuOhxR8ap5EvVenRBdA3tvScdOrLuM+pS/N\nt78ydYi1NwKBgQDRyYAtCMDWTFnmrXId0SMsothjBWvv+AnxpL2FK4X2kwo4FXat\nnVEhFDooL7oIPV4vuJ27f0muvSiSmCJhRNI068eqhw9242qXeUFWtDXHIA57UJQC\njF0hNEh1qOGuilHKu0SO9ZG9DCuBniWmIesKREzEIKFRXR/XdFnsLAaSrQKBgBSH\ns1L7cd0gpGaPVJZJGQd++B4K9/AsxU4dHLFPM9yxWHBp3d3SR6Chcb3X6FvRDR7a\nBQ3xYDhO3mQzcPIT9Q1BqG4DASkr2AtoSrepo8pI4B4uie5tkQWLVEE2GqCr2VNT\n8b79NbHigRMy/0DmJn+BM3fdye5XLKcWdzEVzQFPAoGABF4iS6rRLqRW5IQqB7q1\nsqdbWJb7k7DhpjCuJL+zNKs9zvJPjMJse8vd4VyoKxP9fHR44ol0YiBPgP3OYGwG\nj3OLvrFV39d3yRzyad77LHjFT29TR43LATBpp9S3YQLFpREvl9wtuD9GavHFZGpv\nPucTJX24XHtd1P2BcZmQHiw=\n-----END PRIVATE KEY-----\n"

# Google Gemini API
GEMINI_API_KEY=sua-chave-api-gemini-aqui
```

## ⚠️ IMPORTANTE

1. **Não commite o `.env.local`** - Ele já está no `.gitignore`
2. **Use aspas duplas** para valores com espaços ou caracteres especiais
3. **Mantenha as quebras de linha `\n`** na `FIREBASE_ADMIN_PRIVATE_KEY`
4. **Sem espaços** antes ou depois do `=`

## 🔍 Verificar se está funcionando

Após criar o `.env.local`, reinicie o servidor de desenvolvimento:

```bash
npm run dev
```

Os logs devem mostrar:
- `✅ Firebase Admin inicializado via variáveis de ambiente (Vercel)` ou
- `✅ Firebase Admin inicializado via arquivo JSON (desenvolvimento local)`

## 📝 Notas

- O `.env.local` é usado apenas para **desenvolvimento local**
- Para **produção (Vercel)**, configure as variáveis no painel do Vercel
- Se você tiver o arquivo `serviceAccountKey.json` na raiz, ele terá prioridade sobre as variáveis de ambiente

