FROM gotenberg/gotenberg:8

ENV DENY_FILES='file:(?!//\/tmp/)'
ENV DENY_LOCALHOST='localhost|127\.'
ENV DENY_PRIVATE_IP='10\.|172\.|192\.168\.'
ENV DENY_CLOUD='169\.254\.'

CMD exec gotenberg --api-timeout=30s \
    --chromium-deny-list="^(${DENY_FILES}|https://(${DENY_LOCALHOST}|${DENY_PRIVATE_IP}|{DENY_CLOUD})).*"
