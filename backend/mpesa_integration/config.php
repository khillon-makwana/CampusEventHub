<?php
// backend/mpesa_integration/config.php

// NOTE: You must update 'callbackUrl' to a live HTTPS URL
// For local testing, use a service like ngrok: `ngrok http 80`
// Then update callbackUrl to: 'https://[ngrok-id].ngrok.io/CampusEventHub/backend/mpesa_integration/mpesa_callback.php'

return [
    'env' => 'sandbox', // or 'live'
    'consumerKey' => 'LowgnODhGHwZELb0DNqS1n2DkhxmSbAgEsGSkNJYLPKmCpvz',
    'consumerSecret' => 'qEIQA8VdgFDTHMfO5sClIknnDycUDvhuum9vHXWDU9jhU0l9nIoFxpzdXsu24xk9',
    'shortcode' => '174379', // Default test shortcode
    'passkey' => 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
    'callbackUrl' => 'https://your-ngrok-domain.ngrok.io/CampusEventHub/backend/mpesa_integration/mpesa_callback.php',
    'baseUrl' => 'https://sandbox.safaricom.co.ke',
];
