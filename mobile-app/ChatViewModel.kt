package com.example.whatsappclone.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.whatsappclone.data.AuthApi
import com.example.whatsappclone.data.LoginRequest
import com.example.whatsappclone.data.SocketHandler
import com.example.whatsappclone.models.Message
import com.example.whatsappclone.models.User
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Locale

class ChatViewModel(private val api: AuthApi) : ViewModel() {
    private val _messages = MutableStateFlow<List<Message>>(emptyList())
    val messages = _messages.asStateFlow()

    private val _users = MutableStateFlow<List<User>>(emptyList())
    val users = _users.asStateFlow()

    private var socketHandler: SocketHandler? = null
    private var authToken: String? = null
    private var myId: String? = null

    private val dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)

    fun login(phone: String, pass: String) {
        viewModelScope.launch {
            try {
                val response = api.login(LoginRequest(phone, pass))
                authToken = response.token
                myId = response.user.id
                initSocket(response.token)
                loadUsers()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun loadUsers() {
        viewModelScope.launch {
            try {
                _users.value = api.getUsers()
            } catch (e: Exception) { e.printStackTrace() }
        }
    }

    fun loadChatHistory(otherId: String) {
        val token = authToken ?: return
        viewModelScope.launch {
            try {
                _messages.value = api.getMessages(otherId, "Bearer $token")
            } catch (e: Exception) { e.printStackTrace() }
        }
    }

    private fun initSocket(token: String) {
        socketHandler = SocketHandler(token).apply {
            connect()
            onReceiveMessage { json ->
                val msg = parseMessage(json)
                _messages.value = _messages.value + msg
            }
            onMessageSent { json ->
                val msg = parseMessage(json)
                _messages.value = _messages.value + msg
            }
        }
    }

    private fun parseMessage(json: JSONObject): Message {
        return Message(
            id = json.getString("id"),
            content = json.getString("content"),
            senderId = json.getString("senderId"),
            receiverId = json.getString("receiverId"),
            createdAt = try { dateFormat.parse(json.getString("createdAt")) } catch (e: Exception) { java.util.Date() }
        )
    }

    fun sendMessage(receiverId: String, content: String) {
        socketHandler?.sendMessage(receiverId, content)
    }

    override fun onCleared() {
        super.onCleared()
        socketHandler?.disconnect()
    }
}
