package com.minexpert.hns.service.communications;

/**
 * Abstraction for sending outbound communication messages.
 */
public interface MessageSender {

    /**
     * Sends the message to the given recipient.
     *
     * @param toEmail recipient email address
     * @param subject message subject line
     * @param body    message body (plain text or HTML based on implementation)
     * @throws Exception if the underlying transport fails
     */
    void send(String toEmail, String subject, String body) throws Exception;
}

