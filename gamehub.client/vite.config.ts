import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import childProcess from 'child_process';

const getDevelopmentHttps = () => {
    const baseFolder = process.env.APPDATA
        ? `${process.env.APPDATA}/ASP.NET/https`
        : `${process.env.USERPROFILE}/.aspnet/https`;

    const certificateName = 'gamehub.client';
    const certFilePath = path.join(baseFolder, `${certificateName}.pem`);
    const keyFilePath = path.join(baseFolder, `${certificateName}.key`);

    fs.mkdirSync(baseFolder, { recursive: true });

    if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath)) {
        const result = childProcess.spawnSync('dotnet', [
            'dev-certs',
            'https',
            '--export-path',
            certFilePath,
            '--format',
            'Pem',
            '--no-password'
        ], { stdio: 'inherit' });

        if (result.status !== 0) {
            throw new Error('Não foi possível criar o certificado HTTPS de desenvolvimento.');
        }
    }

    return {
        key: fs.readFileSync(keyFilePath),
        cert: fs.readFileSync(certFilePath)
    };
};

export default defineConfig(({ command }) => ({
    plugins: [plugin()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: {
        proxy: {
            '^/weatherforecast': {
                target: 'https://localhost:7045/',
                secure: false
            }
        },
        port: 5173,
        https: command === 'serve' ? getDevelopmentHttps() : undefined
    }
}));
