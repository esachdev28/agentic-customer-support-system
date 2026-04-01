# 🏛️ System Architecture

### Diagram
```text
[ USER QUERY ]
      |
      v
[ WEBHOOK / API ]
      |
      +-----------------------------------------+
      |                                         |
[ CLASSIFIER AGENT ]                      [ SENTIMENT AGENT ]
      |                                         |
      v                                         v
[ CATEGORY & PRIORITY ]                  [ EMOTION & SCORE ]
      |                                         |
      +--------------------+--------------------+
                           |
                           v
              [ ESCALATION HANDLER AGENT ]
                           |
            +--------------+--------------+
            |                             |
      [ YES (Complex) ]             [ NO (Simple) ]
            |                             |
            v                             v
    [ HUMAN PIPELINE ]             [ FAQ AGENT ]
            |                             |
            v                             v
    [ FRESHDESK / ZENDESK ]        [ AI AUTO-RESPONSE ]
```

### Explanation
Our architecture uses a **Parallel Fan-out** pattern where classification and sentiment analysis happen concurrently. The results are aggregated by the **Escalation Handler**—the "brain" of the system—which determines the routing logic. This ensures that a frustrated customer is never forced to interact with an FAQ bot, maintaining brand reputation and customer satisfaction.
