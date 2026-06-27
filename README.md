TeamMe to aplikacja webowa wspomagająca proces tworzenia zespołów projektowych. Projekt został przygotowany w ramach pracy inżynierskiej.

Do uruchomienia aplikacji wymagane są:
- Git,
- Docker Desktop lub Docker z Docker Compose.

Zalecana jest instalacja Docker Desktop, ponieważ znacząco upraszcza przygotowanie środowiska i uruchamianie wszystkich usług aplikacji.

Repozytorium nie zawiera pliku .env, ponieważ przechowuje on wartości pofune oraz katalogu certs/, w którym znajdują się certyfikaty i klucze prywatne. 

Przed uruchomieniem aplikacji należy utworzyć plik .env oraz katalog certs/ w głównym katalogu projektu, czyli w tym samym miejscu, w którym znajduje się plik docker-compose.yaml.

Przykładowa zawartość pliku .env:

      POSTGRES_DB=test
      
      POSTGRES_USER=test
      
      POSTGRES_PASSWORD=test
      
      JWT_SECRET=dlugi-przypadkowy-ciag-znakow
      
      FRONTEND_ORIGIN=https://localhost
      
      CORS_ALLOWED_ORIGINS=https://localhost,http://localhost:5173
      
      COOKIE_SECURE=true

Generowanie certyfikatu dla środowiska lokalnego:

      openssl req -x509 -nodes -days 365 -newkey rsa:2048 \ 

         -keyout certs/localhost-key.pem \ 

         -out certs/localhost.pem \ 

         -subj "/CN=localhost"

Uruchomienie aplikacji

1. Sklonuj repozytorium:
   
       git clone https://github.com/Zetka35/Engineering-Thesis-TeamMe.git
   
2. Przejdź do katalogu projektu:

         cd Engineering-Thesis-TeamMe
   
3. Utwórz plik .env oraz utwórz certyfikaty w katalogu certs/ w głównym katalogu projektu.
   
4. Uruchom aplikację za pomocą Docker Compose:
   
       docker compose up --build
   
5. Po uruchomieniu kontenerów otwórz aplikację w przeglądarce:
   
       https://localhost/

Przy pierwszym wejściu przeglądarka może wyświetlić ostrzeżenie dotyczące certyfikatu HTTPS, ponieważ środowisko lokalne korzysta z certyfikatu przygotowanego na potrzeby uruchomienia aplikacji lokalnie.

#Aby zatrzymać działające kontenery, można użyć skrótu:

     Ctrl + C

#Następnie można wykonać polecenie:

     docker compose down

#Jeżeli konieczne jest usunięcie również wolumenów z danymi bazy, można użyć:

     docker compose down -v
