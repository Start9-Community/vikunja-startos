# Both images are upstream's, unchanged except for an empty /proc. StartOS
# mounts procfs there when a subcontainer starts and never creates it.
# `docker export` used to add it; start-cli 2.4.0 exports the image directly,
# so an image whose layers lack /proc arrives without one and every subcontainer
# on it fails with "mount procfs: ENOENT" (Start9Labs/start-technologies#4301).
# WORKDIR creates the directory without needing a shell, which the vikunja
# image (FROM scratch) does not have; the second WORKDIR restores the image's
# own working directory. Drop this file, and go back to `dockerTag` in the
# manifest, once a start-cli release packs /proc again.
ARG IMAGE
FROM ${IMAGE}
ARG WORKDIR=/
WORKDIR /proc
WORKDIR ${WORKDIR}
