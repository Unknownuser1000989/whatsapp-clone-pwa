package com.example.whatsappclone.data

import com.example.whatsappclone.models.Message
import com.example.whatsappclone.models.User
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface AuthApi {
    @POST("api/auth/register")
    suspend fun register(@Body request: RegisterRequest): RegisterResponse

    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): LoginResponse

    @GET("api/auth/users")
    suspend fun getUsers(): List<User>

    @GET("api/auth/search")
    suspend fun searchUser(@Query("phone") phone: String): User

    @GET("api/auth/messages/{otherId}")
    suspend fun getMessages(
        @Path("otherId") otherId: String,
        @Header("Authorization") token: String
    ): List<Message>
}

data class RegisterRequest(val phone: String, val password: String, val name: String?)
data class RegisterResponse(val message: String, val userId: String)
data class LoginRequest(val phone: String, val password: String)
data class LoginResponse(val token: String, val user: User)
