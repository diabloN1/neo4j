package com.neo4flix.movie.service;

import org.springframework.stereotype.Service;

import java.net.*;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Set;

@Service
public class MediaValidatorService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;
    private static final Duration TIMEOUT = Duration.ofSeconds(3);

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "image/avif");

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(TIMEOUT)
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    public String validatePosterUrl(String url) {
        if (url == null || url.isBlank()) {
            return null;
        }

        String trimmedUrl = url.trim();

        // checking URI Syntax
        URI uri;
        try {
            uri = URI.create(trimmedUrl);
            String scheme = uri.getScheme();
            if (scheme == null || !(scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"))) {
                throw new IllegalArgumentException("Poster URL must start with http:// or https://");
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid poster URL format");
        }

        validatePublicHost(uri.getHost());

        // USign HTTP HEAD to verify ContentType & size without downloading the body
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(uri)
                    .timeout(TIMEOUT)
                    .header("User-Agent", "Neo4flix-Bot/1.0")
                    .method("HEAD", HttpRequest.BodyPublishers.noBody())
                    .build();

            HttpResponse<Void> response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());

            // If the server forbids HEAD (some CDNs return 405), fallback to a bounded GET
            if (response.statusCode() == 405) {
                request = HttpRequest.newBuilder()
                        .uri(uri)
                        .timeout(TIMEOUT)
                        .header("User-Agent", "Neo4flix-Bot/1.0")
                        .GET()
                        .build();
                response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
            }

            if (response.statusCode() < 200 || response.statusCode() >= 400) {
                throw new IllegalArgumentException("Poster image URL returned HTTP status: " + response.statusCode());
            }

            // Check Content length before trying to download a big file (ZIPBOMBE) which
            // can cause an OOM out-of-memory
            long contentLength = response.headers()
                    .firstValueAsLong("Content-Length")
                    .orElse(0L);

            if (contentLength > MAX_FILE_SIZE) {
                throw new IllegalArgumentException("Poster image exceeds the maximum permitted size of 10 MB");
            }

            String contentType = response.headers()
                    .firstValue("Content-Type")
                    .map(String::toLowerCase)
                    .orElse("");

            boolean isAllowedImage = ALLOWED_MIME_TYPES.stream()
                    .anyMatch(contentType::startsWith);

            if (!isAllowedImage) {
                throw new IllegalArgumentException(
                        "The URL does not point to a valid image. Detected type: "
                                + (contentType.isBlank() ? "unknown" : contentType));
            }

        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalArgumentException(
                    "Unable to reach or verify poster image at the provided URL: " + ex.getMessage());
        }

        return trimmedUrl;
    }

    // block ssrf attake by blocking internal IPs
    private void validatePublicHost(String host) {
        if (host == null || host.isBlank()) {
            throw new IllegalArgumentException("Invalid host in poster URL");
        }

        try {
            InetAddress address = InetAddress.getByName(host);
            if (address.isAnyLocalAddress()
                    || address.isLoopbackAddress()
                    || address.isSiteLocalAddress()
                    || address.isLinkLocalAddress()
                    || address.isMulticastAddress()) {
                throw new IllegalArgumentException("Poster URL cannot point to internal or private addresses");
            }
        } catch (UnknownHostException e) {
            throw new IllegalArgumentException("Could not resolve host: " + host);
        }
    }
}