FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
ENV DISPLAY=:1
ENV DOWNLOAD_DIR=/home/volatile/downloads
ENV HOME=/home/volatile
ENV USER=volatile

RUN apt-get update && apt-get install -y \
    firefox \
    fluxbox \
    novnc \
    python3 \
    python3-websockify \
    supervisor \
    tigervnc-standalone-server \
    xvfb \
    x11vnc \
    xdotool \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -ms /bin/bash volatile && \
    mkdir -p /home/volatile/downloads /home/volatile/.config/supervisor /opt/volatile && \
    chown -R volatile:volatile /home/volatile /opt/volatile

COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY launch_firefox.sh /opt/volatile/launch_firefox.sh
COPY firefox-profile/user.js /home/volatile/.mozilla/firefox/volatile.default/user.js
COPY list_files.py /opt/volatile/list_files.py

RUN chmod +x /opt/volatile/launch_firefox.sh && \
    chown -R volatile:volatile /home/volatile/.mozilla

USER volatile
WORKDIR /home/volatile

EXPOSE 6080

CMD ["/usr/bin/supervisord", "-n"]

