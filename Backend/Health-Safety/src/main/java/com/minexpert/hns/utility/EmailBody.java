package com.minexpert.hns.utility;

public class EmailBody {
    public static String buildDemoEmailBody(String content) {
        return String.format("""
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Demo Email</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #f4f4f4;
                            margin: 0;
                            padding: 0;
                        }
                        .container {
                            max-width: 600px;
                            margin: 20px auto;
                            background: #ffffff;
                            border-radius: 8px;
                            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                            overflow: hidden;
                        }
                        .header {
                            background: #4CAF50;
                            color: #ffffff;
                            padding: 20px;
                            text-align: center;
                        }
                        .header h1 {
                            margin: 0;
                            font-size: 24px;
                        }
                        .content {
                            padding: 20px;
                        }
                        .content p {
                            line-height: 1.6;
                            font-size: 16px;
                            color: #333333;
                        }
                        .button {
                            display: inline-block;
                            margin-top: 20px;
                            padding: 10px 20px;
                            background: #4CAF50;
                            color: #ffffff;
                            text-decoration: none;
                            border-radius: 4px;
                        }
                        .footer {
                            background: #eeeeee;
                            text-align: center;
                            padding: 10px;
                            font-size: 13px;
                            color: #777777;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Welcome to the Demo!</h1>
                        </div>
                        <div class="content">
                            <p>Hello,</p>
                            <p>%s</p>
                            <p>
                                <a href="https://your-company.com" class="button">Visit Website</a>
                            </p>
                        </div>
                        <div class="footer">
                            <p>© 2025 Your Company. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
                """, content);
    }

}
