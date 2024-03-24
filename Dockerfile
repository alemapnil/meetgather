FROM python:3.11
WORKDIR /meetgather
ADD . /meetgather
RUN pip install -r requirements.txt
CMD ["python3","app.py"]
EXPOSE 2000