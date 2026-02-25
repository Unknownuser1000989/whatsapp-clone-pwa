package com.example.whatsappclone.models

import java.util.Date

data class User(
    val id: String,
    val phone: String,
    val name: String?
)

data class Message(
    val id: String,
    val content: String,
    val senderId: String,
    val receiverId: String,
    val createdAt: Date
)
