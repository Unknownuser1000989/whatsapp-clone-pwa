package com.example.whatsappclone.data

import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject

class SocketHandler(private val token: String) {
    private var mSocket: Socket? = null
    private val BACKEND_URL = "https://large-dryers-go.loca.lt"

    fun connect() {
        val options = IO.Options.builder()
            .setAuth(mapOf("token" to token))
            .build()
        
        mSocket = IO.socket(BACKEND_URL, options)
        mSocket?.connect()
    }

    fun sendMessage(receiverId: String, content: String) {
        val data = JSONObject()
        data.put("receiverId", receiverId)
        data.put("content", content)
        mSocket?.emit("send_message", data)
    }

    fun onReceiveMessage(onMessage: (JSONObject) -> Unit) {
        mSocket?.on("receive_message") { args ->
            if (args.isNotEmpty()) {
                onMessage(args[0] as JSONObject)
            }
        }
    }

    fun onMessageSent(onSent: (JSONObject) -> Unit) {
        mSocket?.on("message_sent") { args ->
            if (args.isNotEmpty()) {
                onSent(args[0] as JSONObject)
            }
        }
    }

    fun disconnect() {
        mSocket?.disconnect()
    }
}
