if [ "$PIPENV_VENV_IN_PROJECT" != "1" ]; then
	echo '' >> ~/.bashrc 
	echo 'export PIPENV_VENV_IN_PROJECT=1' >> ~/.bashrc 
fi

if [ "$PIPENV_IGNORE_VIRTUALENVS" != "1" ]; then
	echo '' >> ~/.bashrc 
	echo 'export PIPENV_IGNORE_VIRTUALENVS=1' >> ~/.bashrc 
fi

. ~/.bashrc
