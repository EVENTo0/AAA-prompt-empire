package ae.evento.admin;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.nio.charset.StandardCharsets;

final class EventoApi {
    private EventoApi() {}

    static String get(String baseUrl, String token, String path) throws Exception {
        HttpURLConnection connection = open(baseUrl, token, path, "GET");
        return read(connection);
    }

    static String post(String baseUrl, String token, String path, JSONObject body) throws Exception {
        HttpURLConnection connection = open(baseUrl, token, path, "POST");
        connection.setDoOutput(true);
        byte[] data = body.toString().getBytes(StandardCharsets.UTF_8);
        connection.setFixedLengthStreamingMode(data.length);
        try (OutputStream stream = connection.getOutputStream()) {
            stream.write(data);
        }
        return read(connection);
    }

    static String patch(String baseUrl, String token, String path, JSONObject body) throws Exception {
        HttpURLConnection connection = open(baseUrl, token, path, "PATCH");
        connection.setDoOutput(true);
        byte[] data = body.toString().getBytes(StandardCharsets.UTF_8);
        connection.setFixedLengthStreamingMode(data.length);
        try (OutputStream stream = connection.getOutputStream()) {
            stream.write(data);
        }
        return read(connection);
    }

    private static HttpURLConnection open(String baseUrl, String token, String path, String method) throws Exception {
        String normalized = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        URI uri = URI.create(normalized + path);
        if (!"https".equalsIgnoreCase(uri.getScheme())) {
            throw new IllegalArgumentException("HTTPS endpoint required");
        }
        HttpURLConnection connection = (HttpURLConnection) uri.toURL().openConnection();
        connection.setRequestMethod(method);
        connection.setConnectTimeout(5000);
        connection.setReadTimeout(10000);
        connection.setRequestProperty("Authorization", "Bearer " + token);
        connection.setRequestProperty("Accept", "application/json");
        connection.setRequestProperty("Content-Type", "application/json");
        return connection;
    }

    private static String read(HttpURLConnection connection) throws Exception {
        int code = connection.getResponseCode();
        BufferedReader reader = new BufferedReader(new InputStreamReader(
                code >= 200 && code < 300 ? connection.getInputStream() : connection.getErrorStream(),
                StandardCharsets.UTF_8));
        StringBuilder builder = new StringBuilder();
        for (String line; (line = reader.readLine()) != null; ) {
            builder.append(line).append('\n');
        }
        if (code < 200 || code >= 300) {
            throw new IllegalStateException("HTTP " + code + ": " + builder);
        }
        return builder.toString();
    }
}
