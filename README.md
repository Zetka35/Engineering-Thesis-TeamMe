TeamMe to aplikacja webowa wspomagająca proces tworzenia zespołów projektowych. Projekt został przygotowany w ramach pracy inżynierskiej.

Do uruchomienia aplikacji wymagane są:
- Git,
- Docker Desktop lub Docker z Docker Compose.

Zalecana jest instalacja Docker Desktop, ponieważ znacząco upraszcza przygotowanie środowiska i uruchamianie wszystkich usług aplikacji.

Uruchomienie aplikacji

1. Sklonuj repozytorium:
   
    git clone https://github.com/Zetka35/Engineering-Thesis-TeamMe.git
   
2. Przejdź do katalogu projektu:

   cd Engineering-Thesis-TeamMe
   
3. Uruchom aplikację za pomocą Docker Compose:
   
    docker compose up --build
   
4. Po uruchomieniu kontenerów otwórz aplikację w przeglądarce:
   
    https://localhost/

Przy pierwszym wejściu przeglądarka może wyświetlić ostrzeżenie dotyczące certyfikatu HTTPS, ponieważ środowisko lokalne korzysta z certyfikatu przygotowanego na potrzeby uruchomienia aplikacji lokalnie.

#Aby zatrzymać działające kontenery, można użyć skrótu:

  Ctrl + C

#Następnie można wykonać polecenie:

  docker compose down

#Jeżeli konieczne jest usunięcie również wolumenów z danymi bazy, można użyć:

  docker compose down -v
