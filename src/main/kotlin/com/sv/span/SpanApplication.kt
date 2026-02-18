package com.sv.span

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class SpanApplication

fun main(args: Array<String>) {
	runApplication<SpanApplication>(*args)
}
