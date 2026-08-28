package com.example.sms_reader

import android.Manifest
import android.content.pm.PackageManager
import android.database.Cursor
import android.net.Uri
import android.os.Build
import android.provider.ContactsContract
import android.telephony.SmsManager
import androidx.core.content.ContextCompat
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {

    private val CHANNEL = "com.securesms.dashboard/sms"
    private val contactCache = mutableMapOf<String, String>()

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {

                "getSmsMessages" -> {
                    val type  = call.argument<String>("type") ?: "all"
                    val limit = call.argument<Int>("limit") ?: 500
                    try {
                        result.success(readSmsMessages(type, limit))
                    } catch (e: Exception) {
                        result.error("SMS_ERROR", e.message, null)
                    }
                }

                "sendSms" -> {
                    val phoneNumber = call.argument<String>("phoneNumber") ?: ""
                    val message     = call.argument<String>("message") ?: ""
                    if (phoneNumber.isBlank() || message.isBlank()) {
                        result.error("INVALID", "Phone number and message are required", null)
                        return@setMethodCallHandler
                    }
                    val hasPerm = ContextCompat.checkSelfPermission(
                        this, Manifest.permission.SEND_SMS
                    ) == PackageManager.PERMISSION_GRANTED
                    if (!hasPerm) {
                        result.error("NO_PERMISSION", "SEND_SMS permission not granted", null)
                        return@setMethodCallHandler
                    }
                    try {
                        val smsManager: SmsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                            getSystemService(SmsManager::class.java)
                        } else {
                            @Suppress("DEPRECATION")
                            SmsManager.getDefault()
                        }
                        // Split long messages automatically
                        val parts = smsManager.divideMessage(message)
                        if (parts.size == 1) {
                            smsManager.sendTextMessage(phoneNumber, null, message, null, null)
                        } else {
                            smsManager.sendMultipartTextMessage(phoneNumber, null, parts, null, null)
                        }
                        result.success(true)
                    } catch (e: Exception) {
                        result.error("SEND_ERROR", e.message, null)
                    }
                }

                "checkPermission" -> {
                    val granted = ContextCompat.checkSelfPermission(
                        this, Manifest.permission.READ_SMS
                    ) == PackageManager.PERMISSION_GRANTED
                    result.success(granted)
                }

                "getDeviceInfo" -> {
                    result.success(mapOf(
                        "deviceName"     to "${Build.MANUFACTURER} ${Build.MODEL}",
                        "platform"       to "Android",
                        "androidVersion" to Build.VERSION.RELEASE,
                        "sdkInt"         to Build.VERSION.SDK_INT.toString()
                    ))
                }

                else -> result.notImplemented()
            }
        }
    }

    // ── Contact lookup ─────────────────────────────────────────────────────
    private fun lookupContactName(phoneNumber: String): String {
        if (phoneNumber.isBlank()) return phoneNumber
        contactCache[phoneNumber]?.let { return it }

        val hasContactPerm = ContextCompat.checkSelfPermission(
            this, Manifest.permission.READ_CONTACTS
        ) == PackageManager.PERMISSION_GRANTED

        if (!hasContactPerm) return phoneNumber

        val uri = Uri.withAppendedPath(
            ContactsContract.PhoneLookup.CONTENT_FILTER_URI,
            Uri.encode(phoneNumber)
        )
        val cursor: Cursor? = contentResolver.query(
            uri, arrayOf(ContactsContract.PhoneLookup.DISPLAY_NAME), null, null, null
        )
        val name = cursor?.use { c -> if (c.moveToFirst()) c.getString(0) else null }
        val resolved = name ?: phoneNumber
        contactCache[phoneNumber] = resolved
        return resolved
    }

    // ── SMS reader ─────────────────────────────────────────────────────────
    private fun readSmsMessages(type: String, limit: Int): List<Map<String, Any?>> {
        val messages = mutableListOf<Map<String, Any?>>()

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_SMS)
            != PackageManager.PERMISSION_GRANTED
        ) return messages

        val uris = when (type) {
            "inbox" -> listOf(Uri.parse("content://sms/inbox"))
            "sent"  -> listOf(Uri.parse("content://sms/sent"))
            else    -> listOf(Uri.parse("content://sms/inbox"), Uri.parse("content://sms/sent"))
        }

        val projection = arrayOf("_id", "address", "body", "date", "type", "read", "thread_id")
        var count = 0

        for (uri in uris) {
            if (count >= limit) break
            val remaining = limit - count

            val cursor: Cursor? = contentResolver.query(
                uri, projection, null, null, "date DESC LIMIT $remaining"
            )

            cursor?.use { c ->
                val idIdx     = c.getColumnIndex("_id")
                val addrIdx   = c.getColumnIndex("address")
                val bodyIdx   = c.getColumnIndex("body")
                val dateIdx   = c.getColumnIndex("date")
                val readIdx   = c.getColumnIndex("read")
                val threadIdx = c.getColumnIndex("thread_id")
                val isSent    = uri.toString().contains("sent")

                while (c.moveToNext() && count < limit) {
                    val rawAddress  = if (addrIdx  >= 0) c.getString(addrIdx)  ?: "" else ""
                    val contactName = lookupContactName(rawAddress)

                    messages.add(mapOf(
                        "deviceMessageId" to (if (idIdx >= 0) c.getString(idIdx) ?: "" else ""),
                        "sender"          to rawAddress,
                        "contactName"     to contactName,
                        "body"            to (if (bodyIdx  >= 0) c.getString(bodyIdx)  ?: "" else ""),
                        "timestamp"       to (if (dateIdx  >= 0) c.getLong(dateIdx)        else 0L),
                        "type"            to if (isSent) "sent" else "inbox",
                        "read"            to (if (readIdx  >= 0) c.getInt(readIdx) == 1    else true),
                        "threadId"        to (if (threadIdx >= 0) c.getString(threadIdx) ?: "" else "")
                    ))
                    count++
                }
            }
        }

        return messages
    }
}
