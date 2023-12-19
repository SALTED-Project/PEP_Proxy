# PEP Proxy

## Introduction
This repository contains the PEP Proxy developed by Universidad de Cantabria (UC) within the [SALTED project](https://salted-project.eu/). This proxy is intended to be located in front of an NGSI-LD broker with a PDP backend, such as Keycloak.

## Installation
The most simple and effective way of deploying the PEP Proxy is by using the provided *Dockerfile*. Before doing so, however, you need to adapt the configuration to your particular needs. You can do that by modifying the *config.json* and the *keycloak.json* files. You can extract the latter from your Admin console within your PDP ("download adapter config"). Next you can run the command:
```bash
docker build -t <image-name> .
```
You can choose the image name freely. Finally, you can just run a docker container:
```bash
docker run -p <external_port>:<config_port> <image-name>
```

## Acknowledgement
This work was supported by the European Commission CEF Programme by means of the project SALTED ‘‘Situation-Aware Linked heTerogeneous Enriched Data’’ under the Action Number 2020-EU-IA-0274.

## License
This material is licensed under the GNU Lesser General Public License v3.0 whose full text may be found at the *LICENSE* file.
