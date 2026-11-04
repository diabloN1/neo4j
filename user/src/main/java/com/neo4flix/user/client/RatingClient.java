package com.neo4flix.user.client;

import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;

import com.neo4flix.user.dto.UserRatingResponse;

@FeignClient(name = "rating-service", url = "${services.rating.url}")
public interface RatingClient {
    @GetMapping("/api/ratings/me")
    List<UserRatingResponse> getMyRatings(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorization);

}
