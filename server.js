/*
 * ================================================
 *   ITDesk Mailer - server.js
 *   Gmail SMTP relay for ITDesk v5
 * ================================================
 *
 * SETUP:
 *   1. Fill in your Gmail App Password below
 *   2. Run start-itdesk.bat
 *
 * GET APP PASSWORD:
 *   1. myaccount.google.com/security
 *   2. Turn ON 2-Step Verification
 *   3. myaccount.google.com/apppasswords
 *   4. App name: ITDesk -> Create
 *   5. Copy 16-letter password, paste below (no spaces)
 * ================================================
 */

var express    = require('express');
var nodemailer = require('nodemailer');
var cors       = require('cors');

var app  = express();
var PORT = 8040;

/* ================================================
   EDIT THESE TWO LINES ONLY
   ================================================ */
var GMAIL_USER = 'udr.rajusen@gmail.com';
var GMAIL_PASS = 'PASTE_YOUR_16_CHAR_APP_PASSWORD_HERE';
/* ================================================ */

app.use(cors());
app.use(express.json({ limit: '2mb' }));

/* POST /send */
app.post('/send', function(req, res) {
    var body      = req.body;
    var to_email  = (body.to_email  || '').trim();
    var to_name   = (body.to_name   || to_email).trim();
    var subject   = (body.subject   || '(no subject)').trim();
    var html      = body.html       || '<p>No content</p>';
    var from_name = (body.from_name || 'ITDesk Support').trim();
    var reply_to  = (body.reply_to  || GMAIL_USER).trim();

    if (!to_email) {
        return res.json({ ok: false, error: 'to_email is required' });
    }

    /* Plain-text version (critical for spam score) */
    var text = html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();

    var transporter = nodemailer.createTransport({
        host:       'smtp.gmail.com',
        port:       587,
        secure:     false,
        requireTLS: true,
        auth: { user: GMAIL_USER, pass: GMAIL_PASS },
        tls:  { rejectUnauthorized: false }
    });

    var mailOptions = {
        from:    '"' + from_name + '" <' + GMAIL_USER + '>',
        to:      '"' + to_name   + '" <' + to_email   + '>',
        replyTo: reply_to,
        subject: subject,
        html:    html,
        text:    text,
        headers: {
            'X-Mailer':          'ITDesk-v5',
            'X-Priority':        '3',
            'X-MSMail-Priority': 'Normal',
            'Importance':        'Normal',
            'Precedence':        'bulk',
            'List-Unsubscribe':  '<mailto:' + GMAIL_USER + '?subject=unsubscribe>'
        }
    };

    transporter.sendMail(mailOptions, function(err, info) {
        if (err) {
            console.log('[ERROR] ' + err.message);
            var msg = err.message;
            if (msg.indexOf('535') >= 0 || msg.indexOf('Username and Password') >= 0)
                msg = 'Wrong App Password — go to myaccount.google.com/apppasswords';
            else if (msg.indexOf('534') >= 0)
                msg = '2-Step Verification not enabled — enable at myaccount.google.com/security';
            else if (msg.indexOf('ECONNREFUSED') >= 0)
                msg = 'Cannot connect to Gmail SMTP — check internet connection';
            else if (msg.indexOf('ETIMEDOUT') >= 0)
                msg = 'Timed out — port 587 may be blocked by firewall or antivirus';
            return res.json({ ok: false, error: msg });
        }
        console.log('[SENT] ' + to_email + ' | ' + subject);
        return res.json({ ok: true, messageId: info.messageId });
    });
});

/* GET /health */
app.get('/health', function(req, res) {
    var configured = (GMAIL_PASS !== 'PASTE_YOUR_16_CHAR_APP_PASSWORD_HERE' && GMAIL_PASS.length >= 16);
    res.json({ status: 'ITDesk Mailer running', port: PORT, gmail: GMAIL_USER, configured: configured });
});

/* Start */
app.listen(PORT, function() {
    var configured = (GMAIL_PASS !== 'PASTE_YOUR_16_CHAR_APP_PASSWORD_HERE' && GMAIL_PASS.length >= 16);
    console.log('\n================================================');
    console.log('  ITDesk Mailer v5  —  port ' + PORT);
    console.log('================================================');
    console.log('  Gmail    : ' + GMAIL_USER);
    console.log('  Password : ' + (configured ? 'configured ✓' : '!! NOT SET — edit GMAIL_PASS !!'));
    console.log('  Anti-spam: enabled ✓');
    console.log('  Send URL : http://localhost:' + PORT + '/send');
    console.log('  Health   : http://localhost:' + PORT + '/health');
    console.log('================================================\n');
});
