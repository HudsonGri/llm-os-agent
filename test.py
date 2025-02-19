from canvasapi import Canvas
from dotenv import load_dotenv
import os


load_dotenv()
# Canvas API URL
API_URL = "https://ufl.instructure.com/"
# Canvas API key
API_KEY = os.getenv("CANVAS_API_KEY")

# Initialize a new Canvas object
canvas = Canvas(API_URL, API_KEY)

course = canvas.get_course(525691)

print(course)

files = course.get_files()
pages = course.get_pages()


print(files)
print()
print(pages)
print()

ct = 0
for file in files:
    print(file)
    if ct == 14:
        print()
        print(file.download(str(file)))
        print()
    ct += 1
print()

for page in pages:
    print(page)

