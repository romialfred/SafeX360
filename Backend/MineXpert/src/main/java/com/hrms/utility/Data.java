package com.hrms.utility;

import java.time.Year;

public class Data {

        public static String getResetPasswordBody(String name, String login, String password, String loginUrl,
                        String supportEmail, String companyName, String title, String contactInfo) {
                return "<!DOCTYPE html>\n" +
                                "<html lang=\"en\">\n" +
                                "<head>\n" +
                                "    <meta charset=\"UTF-8\">\n" +
                                "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                                "    <title>Password Reset Notification</title>\n" +
                                "    <style>\n" +
                                "        body {\n" +
                                "            font-family: Arial, sans-serif;\n" +
                                "            margin: 0;\n" +
                                "            padding: 0;\n" +
                                "            background-color: #f4f4f4;\n" +
                                "        }\n" +
                                "        .container {\n" +
                                "            max-width: 600px;\n" +
                                "            margin: 0 auto;\n" +
                                "            padding: 20px;\n" +
                                "            background-color: #ffffff;\n" +
                                "            border-radius: 8px;\n" +
                                "            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);\n" +
                                "        }\n" +
                                "        .header {\n" +
                                "            background-color: #4CAF50;\n" +
                                "            color: #ffffff;\n" +
                                "            padding: 10px;\n" +
                                "            text-align: center;\n" +
                                "            border-radius: 8px 8px 0 0;\n" +
                                "        }\n" +
                                "        .body {\n" +
                                "            padding: 20px;\n" +
                                "            color: #333333;\n" +
                                "        }\n" +
                                "        .credentials {\n" +
                                "            font-size: 18px;\n" +
                                "            font-weight: bold;\n" +
                                "            color: #4CAF50;\n" +
                                "            margin: 20px 0;\n" +
                                "        }\n" +
                                "        .footer {\n" +
                                "            margin-top: 20px;\n" +
                                "            font-size: 12px;\n" +
                                "            color: #888888;\n" +
                                "            text-align: center;\n" +
                                "        }\n" +
                                "    </style>\n" +
                                "</head>\n" +
                                "<body>\n" +
                                "    <div class=\"container\">\n" +
                                "        <div class=\"header\">\n" +
                                "            <h1>Password Reset Notification</h1>\n" +
                                "        </div>\n" +
                                "        <div class=\"body\">\n" +
                                "            <p>Dear <strong>" + name + "</strong>,</p>\n" +
                                "            <p>Your password has been successfully reset. You can now log in to your account using the new temporary password provided below. For your security, you will be prompted to change this password after your first login.</p>\n"
                                +
                                "            <div class=\"credentials\">\n" +
                                "                <p><strong>Username:</strong> " + login + "</p>\n" +
                                "                <p><strong>Temporary Password:</strong> " + password + "</p>\n" +
                                "            </div>\n" +
                                "            <p><strong>Next Steps:</strong></p>\n" +
                                "            <ol>\n" +
                                "                <li>Visit the login page: <a href=\"" + loginUrl
                                + "\">Login URL</a>.</li>\n" +
                                "                <li>Enter your username and temporary password.</li>\n" +
                                "                <li>Follow the on-screen instructions to set a new password.</li>\n" +
                                "            </ol>\n" +
                                "            <p>If you did not request this password reset or encounter any issues, please contact our support team immediately at <a href=\"mailto:"
                                + supportEmail + "\">" + supportEmail + "</a>.</p>\n" +
                                "            <p>Best regards,<br>\n" +
                                "               " + companyName + "<br>\n" +
                                "               " + "Email: " + "<a href=\"mailto:"
                                + supportEmail + "\">" + supportEmail + "</a>" + "<br>\n" +
                                "               " + "Tel: " + contactInfo + "\n" +
                                "            </p>\n" +
                                "        </div>\n" +
                                "        <div class=\"footer\">\n" +
                                "            <p>&copy; " + Year.now().getValue() + " " + companyName
                                + ". All rights reserved.</p>\n" +
                                "        </div>\n" +
                                "    </div>\n" +
                                "</body>\n" +
                                "</html>";

        }

        public static String getMessageBody(String name, String login, String password, String loginUrl,
                        String supportEmail, String companyName, String title, String contactInfo) {
                return "<!DOCTYPE html>\n" +
                                "<html lang=\"en\">\n" +
                                "<head>\n" +
                                "    <meta charset=\"UTF-8\">\n" +
                                "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                                "    <title>Welcome to Mine Xpert Solution</title>\n" +
                                "    <style>\n" +
                                "        body {\n" +
                                "            font-family: Arial, sans-serif;\n" +
                                "            margin: 0;\n" +
                                "            padding: 0;\n" +
                                "            background-color: #f4f4f4;\n" +
                                "        }\n" +
                                "        .container {\n" +
                                "            max-width: 600px;\n" +
                                "            margin: 0 auto;\n" +
                                "            padding: 20px;\n" +
                                "            background-color: #ffffff;\n" +
                                "            border-radius: 8px;\n" +
                                "            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);\n" +
                                "        }\n" +

                                "        .header {\n" +
                                "            background-color: #4CAF50;\n" +
                                "            color: #ffffff;\n" +
                                "            padding: 10px;\n" +
                                "            text-align: center;\n" +
                                "            border-radius: 8px 8px 0 0;\n" +
                                "        }\n" +
                                "        .body {\n" +
                                "            padding: 20px;\n" +
                                "            color: #333333;\n" +
                                "        }\n" +
                                "        .credentials {\n" +
                                "            font-size: 18px;\n" +
                                "            font-weight: bold;\n" +
                                "            color: #4CAF50;\n" +
                                "            margin: 20px 0;\n" +
                                "        }\n" +
                                "        .footer {\n" +
                                "            margin-top: 20px;\n" +
                                "            font-size: 12px;\n" +
                                "            color: #888888;\n" +
                                "            text-align: center;\n" +
                                "        }\n" +
                                "    </style>\n" +
                                "</head>\n" +
                                "<body>\n" +
                                "    <div class=\"container\">\n" +
                                "        <div class=\"header\">\n" +
                                "            <h1>Welcome to Mine Xpert Solution</h1>\n" +
                                "        </div>\n" +
                                "        <div class=\"body\">\n" +
                                "            <p>Dear <strong>" + name + "</strong>,</p>\n" +
                                "            <p>We are pleased to inform you that your account has been successfully created in Mine Xpert System. You can now access your personal dashboard using the login credentials provided below.</p>\n"
                                +
                                "            <div class=\"credentials\">\n" +
                                "                <p><strong>Username:</strong> " + login + "</p>\n" +
                                "                <p><strong>Temporary Password:</strong> " + password + "</p>\n" +
                                "            </div>\n" +
                                "            <p>⚠️ <strong>Important:</strong> For security reasons, you will be prompted to change this temporary password upon your first login. Please choose a strong and unique password, and do not share it with anyone.</p>\n"
                                +
                                "            <h3>How to log in:</h3>\n" +
                                "            <ol>\n" +
                                "                <li>Go to the platform using this link: <a href=\"" + loginUrl
                                + "\">Login URL</a>.</li>\n" +
                                "                <li>Enter your username and the temporary password provided above.</li>\n"
                                +
                                "                <li>Follow the instructions to set a new password immediately after logging in.</li>\n"
                                +
                                "            </ol>\n" +
                                "            <p>If you experience any issues accessing your account or have any questions, please do not hesitate to contact our support team at <a href=\"mailto:"
                                + supportEmail + "\">" + supportEmail + "</a>.</p>\n" +
                                "            <p>Thank you for using our platform. We are here to assist you with any queries you may have.</p>\n"
                                +
                                "            <p>Best regards,<br>\n" +
                                "               " + companyName + "<br>\n" +
                                "               " + "Email: " + "<a href=\"mailto:"
                                + supportEmail + "\">" + supportEmail + "</a>" + "<br>\n" +
                                "               " + "Tel: " + contactInfo + "\n" +
                                "            </p>\n" +
                                "        </div>\n" +
                                "        <div class=\"footer\">\n" +
                                "            <p>&copy; " + Year.now().getValue() + " " + "Data Universe"
                                + ". All rights reserved.</p>\n" +
                                "        </div>\n" +
                                "    </div>\n" +
                                "</body>\n" +
                                "</html>";
        }

        public static String getLeaveApprovalMessage(String employeeName, String leaveType, String startDate,
                        String endDate, String approverName, String approverTitle, String companyName,
                        String contactInfo,
                        String comment) {
                return "<!DOCTYPE html>\n" +
                                "<html lang=\"en\">\n" +
                                "<head>\n" +
                                "    <meta charset=\"UTF-8\">\n" +
                                "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                                "    <title>Leave Request Approval</title>\n" +
                                "    <style>\n" +
                                "        body {\n" +
                                "            font-family: Arial, sans-serif;\n" +
                                "            margin: 0; padding: 0; background-color: #f9f9f9;\n" +
                                "        }\n" +
                                "        .container {\n" +
                                "            max-width: 600px; margin: 20px auto; padding: 20px; background: #fff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);\n"
                                +
                                "        }\n" +
                                "        .header {\n" +
                                "            background-color: #007bff; color: white; padding: 10px; text-align: center; border-radius: 8px 8px 0 0;\n"
                                +
                                "        }\n" +
                                "        .content {\n" +
                                "            padding: 20px; color: #333;\n" +
                                "        }\n" +
                                "        .comment { color: green; font-weight: bold; }\n" +
                                "        .footer {\n" +
                                "            margin-top: 20px; text-align: center; font-size: 12px; color: #888;\n" +
                                "        }\n" +
                                "    </style>\n" +
                                "</head>\n" +
                                "<body>\n" +
                                "    <div class=\"container\">\n" +
                                "        <div class=\"header\">\n" +
                                "            <h1>Leave Request Approval</h1>\n" +
                                "        </div>\n" +
                                "        <div class=\"content\">\n" +
                                "            <p>Dear <strong>" + employeeName + "</strong>,</p>\n" +
                                "            <p>Your <strong>" + leaveType + "</strong> request from <strong>"
                                + startDate
                                + "</strong> to <strong>" + endDate + "</strong> has been approved.</p>\n" +
                                "            <p><strong>Approver's Comment:</strong> <span class=\"comment\">" + comment
                                + "</span></p>\n" +
                                "            <p>Please ensure that any pending tasks are completed or delegated before your leave for a smooth workflow.</p>\n"
                                +
                                "            <p>If you have any updates or further assistance needed, feel free to contact us.</p>\n"
                                +
                                "            <p>Best regards,<br>" +
                                "               " + approverName + "<br>" +
                                "               " + approverTitle + "<br>" +
                                "               " + companyName + "<br>" +
                                "               " + contactInfo + "<br>\n" +
                                "            </p>\n" +
                                "        </div>\n" +
                                "        <div class=\"footer\">\n" +
                                "            <p>&copy; " + Year.now().getValue() + " " + "Roxgold"
                                + ". All rights reserved.</p>\n" +
                                "        </div>\n" +
                                "    </div>\n" +
                                "</body>\n" +
                                "</html>";
        }

        public static String getLeaveRejectionMessage(String employeeName, String leaveType, String startDate,
                        String endDate, String approverName, String approverTitle, String companyName,
                        String contactInfo,
                        String comment) {
                return "<!DOCTYPE html>\n" +
                                "<html lang=\"en\">\n" +
                                "<head>\n" +
                                "    <meta charset=\"UTF-8\">\n" +
                                "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                                "    <title>Leave Request Rejection</title>\n" +
                                "    <style>\n" +
                                "        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f9f9f9; }\n"
                                +
                                "        .container { max-width: 600px; margin: 20px auto; padding: 20px; background: #fff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }\n"
                                +
                                "        .header { background-color: #ff4c4c; color: white; padding: 10px; text-align: center; border-radius: 8px 8px 0 0; }\n"
                                +
                                "        .content { padding: 20px; color: #333; }\n" +
                                "        .comment { color: red; font-weight: bold; }\n" +
                                "        .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #888; }\n"
                                +
                                "    </style>\n" +
                                "</head>\n" +
                                "<body>\n" +
                                "    <div class=\"container\">\n" +
                                "        <div class=\"header\">\n" +
                                "            <h1>Leave Request Rejection</h1>\n" +
                                "        </div>\n" +
                                "        <div class=\"content\">\n" +
                                "            <p>Dear <strong>" + employeeName + "</strong>,</p>\n" +
                                "            <p>We regret to inform you that your <strong>" + leaveType
                                + "</strong> request from <strong>" + startDate + "</strong> to <strong>" + endDate
                                + "</strong> has been rejected.</p>\n" +
                                "            <p><strong>Approver's Comment:</strong> <span class=\"comment\">" + comment
                                + "</span></p>\n" +
                                "            <p>Please contact your manager for further clarification if needed.</p>\n"
                                +
                                "            <p>Best regards,<br>" +
                                "               " + approverName + "<br>" +
                                "               " + approverTitle + "<br>" +
                                "               " + companyName + "<br>" +
                                "               " + contactInfo + "<br>\n" +
                                "            </p>\n" +
                                "        </div>\n" +
                                "        <div class=\"footer\">\n" +
                                "            <p>&copy; " + Year.now().getValue() + " " + companyName
                                + ". All rights reserved.</p>\n" +
                                "        </div>\n" +
                                "    </div>\n" +
                                "</body>\n" +
                                "</html>";
        }

        public static String getSalaryAdvanceApprovedBody(String name, String amount,
                        String supportEmail, String companyName) {
                return "<!DOCTYPE html>\n" +
                                "<html lang=\"en\">\n" +
                                "<head>\n" +
                                "    <meta charset=\"UTF-8\">\n" +
                                "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                                "    <title>Salary Advance Request Approved</title>\n" +
                                "    <style>\n" +
                                "        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }\n"
                                +
                                "        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); }\n"
                                +
                                "        .header { background-color: #4CAF50; color: #ffffff; padding: 10px; text-align: center; border-radius: 8px 8px 0 0; }\n"
                                +
                                "        .body { padding: 20px; color: #333333; }\n" +
                                "        .footer { margin-top: 20px; font-size: 12px; color: #888888; text-align: center; }\n"
                                +
                                "    </style>\n" +
                                "</head>\n" +
                                "<body>\n" +
                                "    <div class=\"container\">\n" +
                                "        <div class=\"header\">\n" +
                                "            <h1>Salary Advance Approved</h1>\n" +
                                "        </div>\n" +
                                "        <div class=\"body\">\n" +
                                "            <p>Dear <strong>" + name + "</strong>,</p>\n" +
                                "            <p>We are pleased to inform you that your salary advance request of <strong>"
                                + amount
                                + "</strong> has been approved.</p>\n" +
                                "            <p>The approved amount will be credited to your account shortly.</p>\n" +
                                "            <p>If you have any questions, please contact our support team at <a href=\"mailto:"
                                + supportEmail + "\">" + supportEmail + "</a>.</p>\n" +
                                "            <p>Best regards,<br>\n" +
                                "               " + companyName + "<br>\n" +
                                "            </p>\n" +
                                "        </div>\n" +
                                "        <div class=\"footer\">\n" +
                                "            <p>&copy; " + Year.now().getValue() + " " + companyName
                                + ". All rights reserved.</p>\n" +
                                "        </div>\n" +
                                "    </div>\n" +
                                "</body>\n" +
                                "</html>";
        }

        public static String getSalaryAdvanceRejectedBody(String name, String supportEmail, String companyName) {
                return "<!DOCTYPE html>\n" +
                                "<html lang=\"en\">\n" +
                                "<head>\n" +
                                "    <meta charset=\"UTF-8\">\n" +
                                "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                                "    <title>Salary Advance Request Rejected</title>\n" +
                                "    <style>\n" +
                                "        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }\n"
                                +
                                "        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); }\n"
                                +
                                "        .header { background-color: #f44336; color: #ffffff; padding: 10px; text-align: center; border-radius: 8px 8px 0 0; }\n"
                                +
                                "        .body { padding: 20px; color: #333333; }\n" +
                                "        .footer { margin-top: 20px; font-size: 12px; color: #888888; text-align: center; }\n"
                                +
                                "    </style>\n" +
                                "</head>\n" +
                                "<body>\n" +
                                "    <div class=\"container\">\n" +
                                "        <div class=\"header\">\n" +
                                "            <h1>Salary Advance Request Rejected</h1>\n" +
                                "        </div>\n" +
                                "        <div class=\"body\">\n" +
                                "            <p>Dear <strong>" + name + "</strong>,</p>\n" +
                                "            <p>We regret to inform you that your salary advance request has been rejected.</p>\n"
                                +
                                "            <p>If you have any questions or require further assistance, please contact our support team.</p>\n"
                                +
                                "            <p>You can reach out to us at <a href=\"mailto:" + supportEmail + "\">"
                                + supportEmail + "</a>.</p>\n" +
                                "            <p>Best regards,<br>\n" +
                                "               " + companyName + "<br>\n" +
                                "            </p>\n" +
                                "        </div>\n" +
                                "        <div class=\"footer\">\n" +
                                "            <p>&copy; " + Year.now().getValue() + " " + companyName
                                + ". All rights reserved.</p>\n" +
                                "        </div>\n" +
                                "    </div>\n" +
                                "</body>\n" +
                                "</html>";
        }
}
