package com.wd32._5.smart_campus.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class WhatsAppNotificationService {

    private static final String FROM         = "whatsapp:+14155238886";
    private static final String TO           = "whatsapp:+94778402705";
    private static final String CONTENT_SID  = "HXb5b62575e6e4ff6129ad7c8efe1f983e";

    @Value("${twilio.account-sid}")
    private String accountSid;

    @Value("${twilio.auth-token}")
    private String authToken;

    @PostConstruct
    public void init() {
        Twilio.init(accountSid, authToken);
    }

    public void sendBookingCreated(String resourceName, String date, String timeSlot) {
        try {
            String variables = "{\"1\":\"" + date + "\",\"2\":\"" + timeSlot + "\"}";
            Message.creator(new PhoneNumber(TO), new PhoneNumber(FROM), (String) null)
                .setContentSid(CONTENT_SID)
                .setContentVariables(variables)
                .create();
        } catch (Exception e) {
            System.err.println("WhatsApp notification failed: " + e.getMessage());
        }
    }
}
