FROM python:2
ENV PYTHONUNBUFFERED 1

RUN mkdir /code
WORKDIR /code
RUN pip install pipenv
COPY Pipfile.lock /code
COPY Pipfile /code
RUN pipenv install --deploy

CMD FLASK_APP=client/client.py FLASK_ENV=development pipenv run flask run --port 7124 --host 0.0.0.0
