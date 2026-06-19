const fs = require('fs');

const content = fs.readFileSync('prototipo/prototype_cotizador/cotizacion.html', 'utf8');

const firmaMatch = content.match(/const IMG_FIRMA = "(data:image\/png;base64,([A-Za-z0-9+/=]+))"/);
if (firmaMatch) {
    fs.writeFileSync('public/assets/logos/firma.png', Buffer.from(firmaMatch[2], 'base64'));
    console.log('Firma saved.');
}

const bankMatch = content.match(/const IMG_BANK\s*=\s*"(data:image\/png;base64,([A-Za-z0-9+/=]+))"/);
if (bankMatch) {
    fs.writeFileSync('public/assets/logos/interbank.png', Buffer.from(bankMatch[2], 'base64'));
    console.log('Bank saved.');
}
