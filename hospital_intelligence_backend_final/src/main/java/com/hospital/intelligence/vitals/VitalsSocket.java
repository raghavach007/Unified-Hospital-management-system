
package com.hospital.intelligence.vitals;

import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.messaging.handler.annotation.MessageMapping;

@Controller
public class VitalsSocket {

    @MessageMapping("/vitals")
    @SendTo("/topic/vitals")
    public String sendVitals() {
        int hr = 60 + (int)(Math.random()*50);
        return "{\"heartRate\":"+hr+",\"critical\":"+(hr>100)+"}";
    }
}
