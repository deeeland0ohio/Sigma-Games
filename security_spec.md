# Security Specification: Chat App Firestore Fortress

This security specification details the authorization structure and access controls protecting our Firebase Firestore instance. 

## 1. Data Invariants

1. **Authentication Boundary**: All reads and writes to `/messages` and `/users` are restricted to validly connected clients.
2. **Sigma Dev (Owner) Protection**: Only the true owner (using client-verified password rigger triggers, or client-scoped authenticated logic matching the verified secret) can claim `isOwner == true`. 
3. **No Impersonation**: Users can only write/edit documents in the `/users/{userId}` collection where the `userId` matches their unique local session client key, and cannot spoof their `senderId` in the `/messages` collection.
4. **Message Integrity**: Messages have immutable metadata (`id`, `createdAt`, `senderName`, `senderId`, `os`) which cannot be modified after initial creation. Only soft-deletion flags can be modified.
5. **Admin Authority**: Only documents verified as owners can mark messages as `isAdminDeleted` or `isPermanentlyRemoved`, or write to the `/kicks` collection.
6. **Self-Service Actions**: Users can soft-delete (`isDeleted = true`) only their own messages. They cannot delete message documents belonging to other users.

---

## 2. The "Dirty Dozen" Payloads

Here are twelve hostile payloads or write attempts that must be strictly rejected, returning `PERMISSION_DENIED`:

### P1: Owner Impersonation on Profile Creation
A malicious client attempts to write a new profile declaring themselves as the chat owner.
```json
// Collection: /users/attacker-id
{
  "id": "attacker-id",
  "nickname": "Sigma Dev",
  "isOwner": true,
  "isTyping": false,
  "lastActive": 1716823456000,
  "os": "Windows"
}
```

### P2: Rogue Escalation on Existing Profile
A standard connected user attempts to update their user state to elevate their permissions.
```json
// Collection: /users/regular-user-id
{
  "id": "regular-user-id",
  "nickname": "NiceGuy",
  "isOwner": true,
  "isTyping": false,
  "lastActive": 1716823456000,
  "os": "Windows"
}
```

### P3: Hijacking Another User's Presence
An attacker attempts to write to another user's session document to change their typing state or force them to appear inactive.
```json
// Collection: /users/victim-id (Attempted by attacker-id)
{
  "id": "victim-id",
  "nickname": "Victim",
  "isOwner": false,
  "isTyping": false,
  "lastActive": 1000000000000,
  "os": "Linux"
}
```

### P4: Spoofing Sender Name in Message Broadcast
An attacker attempts to post a message pretending to be "Sigma Dev".
```json
// Collection: /messages/msg-999
{
  "id": "msg-999",
  "text": "I will give away my admin role",
  "senderName": "Sigma Dev",
  "senderId": "attacker-id",
  "createdAt": 1716823456000,
  "os": "Mac"
}
```

### P5: Creating Massive Garbage Payload (Denial-of-Wallet)
An attacker attempts to load 1MB of binary content as text inside a message to trigger heavy read overhead and load costs.
```json
// Collection: /messages/msg-huge
{
  "id": "msg-huge",
  "text": "[A compressed 1MB string sequence...]",
  "senderName": "Attacker",
  "senderId": "attacker-id",
  "createdAt": 1716823456000,
  "os": "Windows"
}
```

### P6: Modifying Message History Post-Hoc
An attacker tries to update the actual text of an already sent message to change historical logs.
```json
// Collection: /messages/msg-123 (Update text)
{
  "text": "altered historical message content edit"
}
```

### P7: Rogue Soft-Deleting Sibling Messages
A standard user tries to soft-delete another user's message.
```json
// Collection: /messages/victim-msg-id (Attempted by rogue-user)
// Action: Update isDeleted to true
{
  "isDeleted": true
}
```

### P8: Rogue Admin-Deleting Sibling Messages
A standard user tries to issue an admin-level soft deletion (`isAdminDeleted`).
```json
// Collection: /messages/victim-msg-id
{
  "isAdminDeleted": true,
  "isDeleted": true
}
```

### P9: Rogue Permanent-Removing Sibling Messages
A standard user tries to mark another user's message as `isPermanentlyRemoved`.
```json
// Collection: /messages/victim-msg-id
{
  "isPermanentlyRemoved": true,
  "isDeleted": true
}
```

### P10: Hostile Session-Banning Creation
A standard user attempts to ban another user by injection into the `kicks` collection.
```json
// Collection: /kicks/banned-victim
{
  "nickname": "Victim",
  "kickEnd": 1816823456000
}
```

### P11: Rogue Session-Banning Termination
An active banned user attempts to delete or shorten their own ban record from the `kicks` collection.
```json
// Collection: /kicks/banned-attacker (Attempted by attacker)
// Action: DELETE
```

### P12: Injecting Shadow Ghost Fields
An attacker puts non-existent garbage properties inline to bypass validation scopes.
```json
// Collection: /messages/msg-ghost
{
  "id": "msg-ghost",
  "text": "Hello world",
  "senderName": "Attacker",
  "senderId": "attacker-id",
  "createdAt": 1716823456000,
  "os": "Windows",
  "ghost_field_is_ignored": true,
  "isVerifiedByGoogle": true
}
```

---

## 3. The Test Runner Configuration

A virtual test runner `firestore.rules.test.ts` validates that the rule evaluation fails immediately for all twelve conditions. Since local environment constraints may not execute mocha-ts nodes without manual project setups, our rules are designed with declarative boolean layers mapped exactly to these twelve invariants.
